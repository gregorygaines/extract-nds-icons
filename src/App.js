import './App.css';
import {useEffect, useRef, useState} from "react";
import {DragAndDrop} from "./DragAndDrop";
import clsx from 'clsx';
import sanitize from "sanitize-filename";

// TODO DELETE BUTTON AND BUTTON BLOCK ACROSS CARD AND CALCULATE CRC
const acceptedFileExtensions = ".nds";

const iconWidth = 32;
const iconHeight = 32;
const maxScaleOptions = 11;

// NDS
const iconOffsetAddress = 0x68;

const bitmapSize = 0x200;
const bitmapOffset = 0x20;

const colorPaletteOffset = 0x220;
const colorPalletSize = 16;

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
    const tileOffset = (rom[iconOffsetAddress + 3] << 24) | (rom[iconOffsetAddress + 2] << 16) |
        (rom[iconOffsetAddress + 1] << 8) | rom[iconOffsetAddress];

    const bitmap = new Uint8Array(bitmapSize);

    const bitmapStartAddress = tileOffset + bitmapOffset;

    for (let i = 0; i < bitmap.length; ++i) {
        bitmap[i] = rom[bitmapStartAddress + i];
    }

    const colorPalette = new Uint16Array(colorPalletSize);

    let colorPaletteIndex = 0;
    let colorPaletteStartAddress = tileOffset + colorPaletteOffset;

    for (let i = 0; i < 16; i++) {
        const currColorAddress = i * 2;

        colorPalette[colorPaletteIndex++] =
            (rom[(colorPaletteStartAddress + currColorAddress) + 1] << 8) | rom[(colorPaletteStartAddress + currColorAddress)];
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
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (rom.length > 0) {
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

    const handleDeleteROM = () => {
        setROM(new Uint8Array(0));
    }

    const isROMValid = (rom) => {
        try {

        } catch (e) {
            setErrorMessage("Invalid NDS rom");
        }
    }

    return (
        <>
            <nav className="flex p-5 bg-gray-800">
                <div className="container">
                     <span className="inline-flex items-center">
                    <img className="m-2 w-6 items-center" src={`${process.env.PUBLIC_URL}/icon.png`} alt="pokeball logo"/>

                    <p className="text-white font-bold text-xl">
                        NDS Icon Extractor
                    </p>
                </span>
                </div>
            </nav>

            <main className=" mx-auto bg-gray-900">
                <section className="mx-auto text-center container py-10">
                    <header className="text-white">
                        <h1 className="text-4xl lg:text-6xl text-center mx-auto">
                            Extract Icons from <span className="font-bold">Nintendo DS ROMs</span>
                        </h1>
                        <p className="text-left instructions mx-auto mt-9 text-base text-center">How to use: Drag or
                            upload your rom, choose your image size,
                            then click 'Download Icon'.</p>
                    </header>

                    <div className="text-center mx-auto upload-card my-10 text-white">
                        <div className="p-4 bg-white rounded-lg w-96 shadow-xl mx-auto bg-gray-800">
                            <div className="">
                                <h5 className="text-xl mb-5 mt-3 text-center font-bold">Upload your ROM</h5>

                                <div>
                                    {
                                        rom.length > 0 ?
                                            <canvas className="mx-auto text-center shadow-lg rounded"
                                                    ref={displayCanvasRef}/>
                                            :
                                            <DragAndDrop acceptedFileExtensions={acceptedFileExtensions}
                                                         onUpload={handleOnUpload}/>
                                    }
                                </div>

                                <div className="text-left mt-8 mb-2 flex flex-col">
                                    <label className="mb-1 scale-label" htmlFor="scaleSelect">Image Size:</label>
                                    <select id="scaleSelect" className="shadow mb-3 border-2 rounded p-2 text-white bg-gray-800"
                                            onChange={handleScaleChange}>
                                        <option value="1">32x32 (Original)</option>
                                        {
                                            scales.map((scaleSize, index) => {
                                                if (index === scales.length - 1) {
                                                    return <option defaultValue={scaleSize.scale}
                                                                   key={scaleSize.scale}
                                                                   value={scaleSize.scale}
                                                                   selected>{scaleSize.width}x{scaleSize.height}</option>;
                                                }
                                                return <option key={scaleSize.scale}
                                                               value={scaleSize.scale}>{scaleSize.width}x{scaleSize.height}</option>;
                                            })
                                        }
                                    </select>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="mx-auto">
                                    <button className="bg-red-800 text-white rounded py-2 px-4 font-medium mr-3" onClick={() => {
                                        handleDeleteROM();
                                    }}>
                                        Delete Icon
                                    </button>
                                    <a className={clsx("py-2 px-4 font-medium rounded text-white", rom.length === 0 ? "bg-gray-300" : "bg-blue-500")}
                                       download={`${romName}.jpg`}
                                       href={canvasImageURL !== "" ? canvasImageURL : null}>
                                        Download Icon
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer
                className="relative bottom-0 w-full text-white text-center mx-auto font-medium bottom-0 p-5 border-t text-sm bg-gray-800">
                <p className="m-1">
                    Created by <a className="text-purple-50 font-bold underline"
                                  href="https://www.gregorygaines.com" target="_blank"
                                  rel="noopener">Gregory Gaines</a>
                </p>

                <span className="inline-flex gap-1 items-center">

      <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16"><path fillRule="evenodd"
                                                                                               d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
                                                                                               fill="#fff"/></svg>
                    <a className="underline">Source on Github</a>
                </span>
            </footer>
        </>
    );
}

export default App;
