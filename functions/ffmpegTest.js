const ffmpeg = require('fluent-ffmpeg');
const ffmpeg_static = require('ffmpeg-static');
const ffprobe_static = require('ffprobe-static');

const v1 = './video/test/big-buck-bunny_trailer.webm';
const v2 = './video/test/elephants-dream.webm';

/*
from https://www.oodlestechnologies.com/blogs/PICTURE-IN-PICTURE-effect-using-FFMPEG/
ffmpeg -i pipInput1.flv -i pipInput2.flv -filter_complex "[1]scale=iw/5:ih/5 [pip]; [0][pip]
overlay=main_w-overlay_w-10:main_h-overlay_h-10" -profile:v main -level 3.1 -b:v 440k -ar 44100 -ab 128k -s 720x400
-vcodec h264 -acodec libfaac PIP_output1.mp4
*/

const pipScale = 'iw/4:ih/4';
const pipPosition = '10:main_h-overlay_h-10';
const proc = ffmpeg({
  logger: console
})
  .setFfmpegPath(ffmpeg_static)
  .setFfprobePath(ffprobe_static)
  .input(v1)
  .input(v2)
  .on('end', () => console.log('done'))
  .on('error', error => console.error(error.message))
  .output('./video/out.webm')
  .complexFilter(`[1]scale=${pipScale} [pip]; [0][pip] overlay=${pipPosition}`)
  .run();
