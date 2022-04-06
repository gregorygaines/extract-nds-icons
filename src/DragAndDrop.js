import React from "react";
import "./DragAndDrop.css";

const DragAndDrop = ({onUpload, acceptedFileExtensions}) => {
    const handleFileDragAndDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const {files} = e.dataTransfer;

        if (files && files.length) {
            const rom = files[0];
            const name = rom.name;
            const buffer = await rom.arrayBuffer();
            const byteArray = new Uint8Array(buffer);

            onUpload(byteArray, name);
        }
    }

    const handleFileUpload = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const rom = e.target.files[0];
        const name = rom.name;
        const buffer = await rom.arrayBuffer();
        const byteArray = new Uint8Array(buffer);

        onUpload(byteArray, name);
    };

    return (
        <div className="upload relative flex flex-col hover:bg-gray-900 justify-content-center py-10" onDrop={handleFileDragAndDrop}>
            <svg className="plus-icon mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                 xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            <p className="text-sm">Drag & drop</p>
            <p className="text-sm">or Browse</p>
            <input className="file-input pointer" type="file" accept={acceptedFileExtensions} onChange={handleFileUpload} />
        </div>
    );
};

export { DragAndDrop };
