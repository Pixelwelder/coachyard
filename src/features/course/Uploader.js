import React, { useRef } from 'react';

export const Uploader = ({ onChange }) => {
  const fileInputRef = useRef(null);

  const onTargetClick = () => {
    fileInputRef.current.click();
  }

  return (
    <>
      {/*<FileDrop*/}
      {/*  onDrop={() => {}}*/}
      {/*  onTargetClick={onTargetClick}*/}
      {/*/>*/}
      <input className="upload-input" ref={fileInputRef} type="file" onChange={onChange}/>
    </>
    // <input className="upload-input" type="file" onChange={onChange} />
    // : <DropzoneArea
    //     filesLimit={1}
    //     maxFileSize={5000000000}
    //     onChange={onUpload}
    //   />
  );
};
