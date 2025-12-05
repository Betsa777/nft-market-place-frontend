import { useEffect, useRef, useState } from "react";
import "../css/sell.css";
import { getWalletNft, getNftEmoji, hexToString, getAassetId, sellNft } from "../utilities/connectWallet";
import { showTx } from "../utilities/showTx";
import { useNavigate } from "react-router-dom";

export default function Sell() {
    const [nfts, setNfts] = useState([]);
    const [priceInputs, setPriceInputs] = useState({}); // stocke le prix par NFT
    const navigate = useNavigate()
    useEffect(() => {
        async function fetchNfts() {
            const fetchedNfts = await getWalletNft();
            setNfts(fetchedNfts);
        }
        fetchNfts();
    }, []);
    // console.log("NFTs in wallet:", nfts);
    function handlePriceChange(nftUnit, value) {
        setPriceInputs((prev) => ({ ...prev, [nftUnit]: value }));
    }

    async function handleSell(nft) {
        const price = priceInputs[nft.unit];
        if (!price) {
            alert("Please enter a price before selling.");
            return;
        }
        console.log("Selling NFT:", nft);
        console.log("Price:", price);
        const txHash = await sellNft(price, nft);

        showTx(txHash);
        navigate("/")
        // Ici tu peux appeler buildSellTx(nft, price)
    }

    return (
        <div className="sell-container">
            <h1>Sell Your NFTs</h1>

            {nfts.length === 0 ? (
                <p>No NFTs found in your wallet.</p>
            ) : (
                <div className="nft-grid">
                    {nfts.map((nft, index) => {

                        return (
                            <div key={index} className="nft-card">
                                <div className="nft-emoji">{getNftEmoji(nft)}</div>

                                <div className="nft-info">
                                    {/* Here we decode the assetName */}
                                    <p><strong>{nft.assetName}</strong></p>
                                    <p>Asset ID: {getAassetId(nft.policyId, nft.assetName)}</p>
                                </div>

                                <div className="nft-actions">
                                    <label>
                                        Price (ADA):
                                        <input
                                            type="number"
                                            value={priceInputs[nft.unit] || ""}
                                            onChange={(e) =>
                                                handlePriceChange(nft.unit, e.target.value)
                                            }
                                            step="0.01"
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        className="sell-btn"
                                        onClick={() => handleSell(nft)}
                                    >
                                        Sell
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
