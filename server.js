const express = require('express');
const app = express();

require('dotenv').config();

const multer = require('multer');
const upload = multer({dest:"uploads"});

const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URL);

const bcrypt = require('bcrypt');

const File = require('./models/file');

app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.get('/', (req, res) => {
    res.render("index");
});

app.post('/upload', upload.single("file"),async (req, res) => {
    const fileData = {
        path: req.file.path,
        originalName: req.file.originalname,
    }

    if(req.body.password != null && req.body.password !== ""){
        fileData.password = await bcrypt.hash(req.body.password, 10);
    }
    const file = await File.create(fileData);
    res.render("index", {fileLink: `${req.headers.origin}/file/${file._id}`});
});

app.get("/file/:id", handleDownload).post("/file/:id", handleDownload);


async function handleDownload(req, res) {
    // const file = File.findById(req.params.id);
    File.findById(req.params.id)
    .exec()
    .then(async file => {
        if(file.password != null){
            if(req.body.password == null){
                res.render("password");
                return;
            }
    
            if(!await bcrypt.compare(req.body.password, file.password)){
                res.render("password", {error: true});
                return;
            }
        }
        const count = file.downloadCount++;
        await file.save();
        res.download(file.path, file.originalName);
    })
    .catch(err => {
        res.render("password", {error: true});
    })
}

app.listen(process.env.PORT);