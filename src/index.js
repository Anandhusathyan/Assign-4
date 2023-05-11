const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const port = 8080

// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const { connection } = require('./connector');
const Collection = require('mongodb/lib/collection');

app.get('/totalRecovered',async (req,res)=>{

    try{
        const Reco_data = await connection.aggregate([
            {
                $group:{
                    _id:"total",
                    recovered:{
                        $sum: "$recovered"
                    }
                }  
            }
        ])
        res.status(200).json({ data:Reco_data[0] })
    }
    catch(errro){
        res.status(500).json({message: "Internal server error"})
    }
 
})

app.get('/totalActive',async (req,res)=>{

    try{
           const Active_data = await connection.aggregate([
               {
                   $group:{
                       _id:"total",
                       active:{
                            $sum:{
                                $subtract:[ "$infected" , "$recovered" ]
                            }
                       }
                   }
               }
           ])
          res.status(200).json({ data:Active_data[0] })
    }
    catch(error){
        res.status(500).json({ message: "Internal server error" })
    }
 
})

app.get('/totalDeath',async (req,res)=>{

    try{
        const death_data = await connection.aggregate([
            {
                $group:{
                    _id: "total",
                    death:{ $sum: "$death" }
                }
            }
        ])
        res.status(200).json({ data:death_data[0]});
    }
    catch(error){
        res.status(500).json({ message: 'Internel server error' })
    }
 
})

app.get('/hotspotStates',async (req,res)=>{

    
    try{
        const hotspotState_data = await connection.aggregate([
            {
                $project: {
                    _id:0,
                    state:1,
                    rate:{
                        $round:[
                            {
                                $divide:[
                                    { $subtract : ["$infected", "$recovered"]},
                                    "$infected"
                                ]
                            },
                            5
                        ]
                    }
                }
            },
            {
                $match:{
                    rate: {$gt: 0.1}
                }
            },
            {
                $project:{
                    _id:0,
                    state:1,
                    rate: 1
                }
            }
        ]);
        console.log(hotspotState_data);
        res.status(200).json({ data: hotspotState_data });
    }
    catch(error){
        
        console.error(error);
        res.status(500).json( { message: 'Internal server error' } )
    }
    
})

app.get('/healthyStates',async (req,res)=>{

    
    try{
        const healthyState_data=await connection.aggregate([
            {
                $project:{
                    _id:0,
                    state:1,
                    mortality:{ 
                        $round:[
                            {
                                $divide:["$death", "$infected"]
                            },
                            5
                        ]
                    }
                }
            },
            {
                $match:{
                    mortality:{ $lt: 0.005 }
                }
            },
            {
                $project:{
                    _id:0,
                    state:1,
                    mortality:1
                }
            }
        ])
        console.log(healthyState_data);
        res.status(200).json({ data: healthyState_data });
    }
    catch(error){
        console.error(error)
        res.status(500).json({message: "Internal server error"})
    }
    
 
})




app.listen(port, () => console.log(`App listening on port ${port}!`))

module.exports = app;