import React, { useEffect, useState } from 'react';
import app from 'firebase/app';

const StorageImage = ({ url, className = '' }) => {
  const [downloadUrl, setDownloadUrl] = useState('');

  useEffect(() => {
    const go = async () => {
      try {
        const _downloadUrl = await app.storage().ref(url).getDownloadURL();
        setDownloadUrl(_downloadUrl);
      } catch (error) {}
    };
    go();
  }, [url]);

  return (
    <img className={className} src={downloadUrl}/>
  );
};

export default StorageImage;
