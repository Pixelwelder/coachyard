import app from 'firebase/app';
import mimeTypes from 'mime-types';

export default async (ref, { displayName }) => {
  const downloadUrl = await ref.getDownloadURL();
  const metadata = await ref.getMetadata();
  const extension = mimeTypes.extension(metadata.contentType);
  console.log('downloadFile', downloadUrl, metadata, extension);

  const fileName = `${displayName}.${extension}`;
  const req = new XMLHttpRequest();
  req.open("GET", downloadUrl, true);
  req.responseType = "blob";
  req.onload = function () {
    //Convert the Byte Data to BLOB object.
    const blob = new Blob([req.response], { type: "application/octetstream" });

    //Check the Browser type and download the File.
    const isIE = false || !!document.documentMode;
    if (isIE) {
      window.navigator.msSaveBlob(blob, fileName);
    } else {
      const url = window.URL || window.webkitURL;
      const link = url.createObjectURL(blob);
      const a = document.createElement("a");
      a.setAttribute("download", fileName);
      a.setAttribute("href", link);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
  req.send();
}
