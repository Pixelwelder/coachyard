import React, { useEffect, useState } from 'react';
import app from 'firebase/app';

const StorageImage = ({ url }) => {
  const [downloadUrl, setDownloadUrl] = useState('');

  useEffect(() => {
    const go = async () => {
      const _downloadUrl = await app.storage().ref(url).getDownloadURL();
      setDownloadUrl(_downloadUrl);
    };
    go();
  }, [url]);

  return (
    <img className="item-info-image" src={downloadUrl}/>
  );
};

export default StorageImage;
