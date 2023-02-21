// opendl

// require all libs
const {spawn} = require('child_process');
const express = require('express');
const ytdl = require('ytdl-core');
const ffmpeg = require('ffmpeg-static');

const app = express(); // initialize server
app.use(express.urlencoded({extended:true})); // form data parsing

app.get('/', (req, res) => res.sendFile('index.html',{root:__dirname})); // root sends html page

app.post('/dl', async (req, res) => {
    if (!ytdl.validateURL(req.body.url)) {
        return res.status(422).send("Invalid YouTube link/id: "+req.body.url); // error if input incorrect
    };
    const info = await ytdl.getInfo(req.body.url);
    if (req.body.type === "a") {
        res.attachment(info.videoDetails.title+' (opendl).mp3'); // make browser treat as attachment
        const audio = ytdl.downloadFromInfo(info,{quality:'highestaudio'});
        const proc = spawn(ffmpeg, ['-loglevel', '8', '-i', 'pipe:3', '-f', 'mp3', 'pipe:4'], {stdio:['inherit','inherit','inherit','pipe','pipe']}); // convert to mp3
        audio.pipe(proc.stdio[3]);
        proc.stdio[4].pipe(res);
    } else { // otherwise type must be v
        res.attachment(info.videoDetails.title+' (opendl).mp4'); // make browser treat as attachment
        const audio = ytdl.downloadFromInfo(info,{quality:[141,140,139]});
        const video = ytdl.downloadFromInfo(info,{quality:[138,299,298,264,137,136,135,134,133,160]});
        const proc = spawn(ffmpeg, ['-loglevel', '8', '-i', 'pipe:3', '-i', 'pipe:4', '-map', '0:a', '-map', '1:v', '-c', 'copy', '-movflags', 'frag_keyframe+empty_moov', '-f', 'mp4', 'pipe:5'], {stdio:['inherit','inherit','inherit','pipe','pipe','pipe']}); // convert to mp4
        audio.pipe(proc.stdio[3]);
        video.pipe(proc.stdio[4]);
        proc.stdio[5].pipe(res);
    };
});

const listener = app.listen(process.env.PORT || 8080 || 0, () => console.log("It's alive! at localhost:"+listener.address().port));
