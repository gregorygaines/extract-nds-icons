import './App.css';
import {useEffect, useRef, useState} from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {DragAndDrop} from "./DragAndDrop";
import clsx from 'clsx';
import sanitize from "sanitize-filename";

const acceptedFileExtensions = ".nds";

const bitmapSize = 0x200;
const colorPalletSize = 16;

const iconWidth = 32;
const iconHeight = 32;
const maxScaleOptions = 11;

const colorToHex = color => {
    const hex = color.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
};

const rgbToHex = ((color) => {
    let r = color & 0x1F;
    let b = (color >> 10) & 0x1F;
    let g = (color >> 5) & 0x1F;

    r = (r << 3) + (r >> 2);
    g = (g << 3) + (g >> 2);
    b = (b << 3) + (b >> 2);

    return "#" + colorToHex(r) + colorToHex(g) + colorToHex(b);
});

const extractNDSIcon = ((rom, scale, canvas, setCanvasDataURL) => {
    const tileOffset = (((((rom[0x68 + 3] & 0xFF) << 24) | (rom[0x68 + 2] & 0xFF)) << 16) | (
        (rom[0x68 + 1] & 0xFF) << 8) | (rom[0x68] & 0xFF));

    const bitmap = new Uint8Array(0x200);

    for (let i = 0; i < bitmap.length; ++i) {
        bitmap[i] = rom[tileOffset + i + 0x20];
    }

    const colorPalette = new Uint16Array(colorPalletSize);

    let colorPaletteIndex = 0;
    let colorPaletteOffset = tileOffset + 0x0220;

    for (let i = 0; i < 16; i++) {
        const colorStart = i * 2;

        colorPalette[colorPaletteIndex++] =
            (rom[(colorPaletteOffset + colorStart) + 1] << 8) | rom[(colorPaletteOffset + colorStart)];
    }

    canvas.width = 32 * scale;
    canvas.height = 32 * scale;
    const canvasContext = canvas.getContext('2d');

    const totalChunks = 16;
    const pixelsPerChunk = 32;

    for (let chunk = 0; chunk < totalChunks; ++chunk) {
        for (let pixelIndex = 0; pixelIndex < pixelsPerChunk; ++pixelIndex) {
            const pixel = bitmap[(chunk * pixelsPerChunk) + pixelIndex];

            const x = ((chunk * 8) % 32) + (((pixelIndex * 2) % 8));

            const y = ((Math.floor(chunk / 4) * 8) + Math.floor(pixelIndex / 4));

            const leftPixel = pixel & 0xF;
            const rightPixel = (pixel >> 4) & 0xF;

            if (leftPixel !== 0) {
                canvasContext.fillStyle = rgbToHex(colorPalette[leftPixel]);
                canvasContext.fillRect(x * scale, y * scale, scale, scale);
            } else {
                canvasContext.fillStyle = "#FFFFFF";
                canvasContext.fillRect(x * scale, y * scale, scale, scale);
            }

            if (rightPixel !== 0) {
                canvasContext.fillStyle = rgbToHex(colorPalette[rightPixel]);
                canvasContext.fillRect((x + 1) * scale, y * scale, scale, scale);
            } else {
                canvasContext.fillStyle = "#FFFFFF";
                canvasContext.fillRect((x + 1) * scale, y * scale, scale, scale);
            }
        }
    }

    setCanvasDataURL(canvas.toDataURL());
});

const scales = [];

for (let i = 2; i < maxScaleOptions; ++i) {
    scales.push({
        scale: i,
        width: iconWidth * i,
        height: iconHeight * i,
    });
}

function App() {
    const [rom, setROM] = useState(new Uint8Array(0));
    const [romName, setROMName] = useState("");
    const [selectedScale, setSelectedScale] = useState(maxScaleOptions - 1);
    const [canvasImageURL, setCanvasImageURL] = useState("");
    const displayCanvasRef = useRef();

    useEffect(() => {
        console.log("use effect");
        if (rom.length > 0) {
            console.log("Running extract");
            extractNDSIcon(rom, selectedScale, displayCanvasRef.current, setCanvasImageURL);
        }

    }, [rom, selectedScale, displayCanvasRef, romName]);

    const handleOnUpload = (file, name) => {
        const nameWithoutExtension = name.substr(0, name.lastIndexOf('.')) || name;

        setROMName(sanitize(nameWithoutExtension));
        setROM(file);
    }

    const handleScaleChange = (e) => {
        const value = e.target.value;
        setSelectedScale(value);
    }

    const isROMValid = () => {

    }

    return (
        <>
            <nav className="navbar justify-content-center">
                <div className="container-fluid">
                    <p className="navbar-brand text-white fw-bold d-flex align-items-center">
                        <img className="m-2" src="/icon.png" alt="" width="20" height="20"/>
                        NDS Icon Extractor
                    </p>
                </div>
            </nav>
            <div className="h-100 d-flex flex-column">
                <div className="row">
                    <div className="text-center">
                        <h1 className="header text-white w-75 mx-auto mb-4">
                            Extract Icons from Nintendo DS ROMs
                        </h1>
                        <p className="text-white mx-auto instructions">Drag or upload your rom, choose your image size,
                            then click 'Download Icon'. That's it!</p>

                        <div className="p-4 shadow-lg rounded-3 bg-white upload-card mx-auto">
                            <div className="">
                                <h5 className="card-title mb-4 text-center fw-bold">Upload your ROM</h5>

                                <div>
                                    {
                                        rom.length > 0 ?
                                            <canvas ref={displayCanvasRef}/>
                                            :
                                            <DragAndDrop acceptedFileExtensions={acceptedFileExtensions}
                                                         onUpload={handleOnUpload}/>
                                    }
                                </div>

                                <div className="text-left mt-3 mb-2">
                                    <label className="mb-1 scale-label" htmlFor="scaleSelect">Image Size</label>
                                    <select id="scaleSelect" className="form-select mb-3" onChange={handleScaleChange}>
                                        <option value="1">32x32 (Original)</option>
                                        {
                                            scales.map((scaleSize, index) => {
                                                if (index === scales.length - 1) {
                                                    return <option defaultValue={scaleSize.scale}
                                                                   key={scaleSize.scale}
                                                                   value={scaleSize.scale} selected>{scaleSize.width}x{scaleSize.height}</option>;
                                                }
                                                return <option key={scaleSize.scale}
                                                               value={scaleSize.scale}>{scaleSize.width}x{scaleSize.height}</option>;
                                            })
                                        }
                                    </select>
                                </div>
                            </div>
                            <div className="text-center">
                                <a type="button download-button" download={`${romName}.jpg`}
                                   href={canvasImageURL}
                                   className={clsx("btn btn-primary btn-sm", rom.length === 0 && "disabled")}>
                                    Download Icon
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <p className="text-center text-white mt-3">
                Created by <a className="text-decoration-underline text-white creator"
                           href="https://www.gregorygaines.com" target="_blank"
                           rel="noopener">Gregory Gaines</a>
            </p>
        </>
    );
}

export default App;
