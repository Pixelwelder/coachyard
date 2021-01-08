const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { performance } = require('perf_hooks');

const ffmpeg = require('fluent-ffmpeg');
const ffmpeg_static = require('ffmpeg-static');
const ffprobe_static = require('ffprobe-static');
const path = require('path');

const v1 = './_video/test/v1.webm';
const v2 = './_video/test/v2.webm';

const promisifyCommand = (command) => new Promise((resolve, reject) => {
  command
    .on('end', resolve)
    .on('error', reject)
    .run();
});

/*
from https://www.oodlestechnologies.com/blogs/PICTURE-IN-PICTURE-effect-using-FFMPEG/
ffmpeg -i pipInput1.flv -i pipInput2.flv -filter_complex "[1]scale=iw/5:ih/5 [pip]; [0][pip]
overlay=main_w-overlay_w-10:main_h-overlay_h-10" -profile:v main -level 3.1 -b:v 440k -ar 44100 -ab 128k -s 720x400
-vcodec h264 -acodec libfaac PIP_output1.mp4
*/

module.exports = {
  // processVideo: functions.storage.object().onFinalize(async (object) => {
  processVideo: functions
    .runWith({ timeoutSeconds: 540, memory: '2GB' })
    .https.onCall(async (data, context) => {
      // const {
      //   bucket: fileBucket,
      //   name: filePath,
      //   contentType
      // } = object;
      //
      // console.log(fileBucket, filePath, contentType);
      //
      // const fileName = path.basename(filePath);

      const storage = admin.storage();
      const bucket = storage.bucket();

      // ---
      console.log('Attempting _video merge...');
      const startTime = performance.now()
      const pipScale = 'iw/4:ih/4';
      const pipPosition = '10:main_h-overlay_h-10';
      const command = ffmpeg()
        .setFfmpegPath(ffmpeg_static)
        .setFfprobePath(ffprobe_static)
        .input(v1)
        .input(v2)
        .on('end', () => console.log('done'))
        .on('error', error => console.error(error.message))
        .output('/tmp/out.webm')
        .complexFilter(`[1]scale=${pipScale} [pip]; [0][pip] overlay=${pipPosition}`);

      await promisifyCommand(command);
      const endTime = performance.now();
      return {
        message: 'Video merge complete.',
        started: startTime,
        ended: endTime,
        totalTime: endTime - startTime
      };
      console.log('Video merge complete!');
    })
};
