import { useRef, useState } from "react";
import "../css/mint.css";
import { mintNFT } from "../utilities/connectWallet";
import { showTx } from "../utilities/showTx";
import { useNavigate } from "react-router-dom";



export default function Mint() {
    const navigate = useNavigate()
    const nftNameRef = useRef(null);
    async function handleMint(e) {
        e.preventDefault();
        const name = nftNameRef.current?.value;
        console.log("Minting NFT with name:", name);

        // try {
        const txHash = await mintNFT(name);
        showTx(txHash);
        // } catch (error) {
        //     console.error("Error minting NFT:", error);
        //     alert("Failed to mint NFT.");
        // }
        navigate("/")
    }
    return (
        <div className="mint-container">
            <h1>Mint An NFT</h1>

            <form className="mint-form">
                <label>
                    NFT Name:
                    <input type="text" id="name" ref={nftNameRef} />
                </label>

                <button type="submit" onClick={handleMint} className="mint-btn" >
                    Mint
                </button>
            </form>
        </div>
    );
}
