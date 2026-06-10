const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const { appendRow } =
    require("./sheets/googleSheets");

app.use(cors());
app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

app.post("/submit", async (req,res)=>{

    try{

        const d = req.body;

        console.log("POST RECEIVED");
        console.log(JSON.stringify(d,null,2));

        await appendRow(d.row);

        console.log("ROW ADDED");

        res.json({
            success:true
        });

    }
    catch(err){

        console.error("GOOGLE ERROR:");
        console.error(err);

        res.status(500).json({
            success:false
        });

    }

});

app.listen(3000,()=>{
    console.log(
        "Server running on port 3000"
    );
});