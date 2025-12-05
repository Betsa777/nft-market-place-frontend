import { useEffect, useState } from "react";
import "../css/home.css";
import { getValidatorNfts, getNftEmoji, hexToString, buyNft, cancelNft, updateNft } from "../utilities/connectWallet";
import { Data } from "https://unpkg.com/lucid-cardano@0.10.11/web/mod.js";
import { showErrorMsg, showTx } from "../utilities/showTx";

function Home() {
    const [nfts, setNfts] = useState([]);
    const [editingNft, setEditingNft] = useState(null); // NFT en cours d'édition
    const [newPrice, setNewPrice] = useState(""); // Nouveau prix saisi

    useEffect(() => {
        async function fetchNfts() {
            const fetchedNfts = await getValidatorNfts();
            setNfts(fetchedNfts);
        }
        fetchNfts();
    }, []);

    console.log("NFTs for sale:", nfts);

    async function handleBuy(nft) {
        const price = extractPriceFromDatum(nft.utxo);
        if (!price) {
            alert("This NFT is not for sale.");
            return;
        }
        const txHash = await buyNft(price, nft);

        // Recharger les NFTs après l'achat
        const updatedNfts = await getValidatorNfts();
        setNfts(updatedNfts);
        showTx(txHash);
    }

    async function handleCancel(nft) {
        const txHash = await cancelNft(nft);
        // Recharger les NFTs après annulation

        const updatedNfts = await getValidatorNfts();
        setNfts(updatedNfts);
        if (txHash !== undefined)

            showTx(txHash);
    }

    async function handleUpdate(nft) {
        if (!newPrice || parseFloat(newPrice) <= 0) {
            alert("Please enter a valid price");
            return;
        }

        const txHash = await updateNft(parseInt(newPrice), nft);

        setEditingNft(null); // Quitter le mode édition
        setNewPrice(""); // Réinitialiser le champ

        // Recharger les NFTs après mise à jour
        const updatedNfts = await getValidatorNfts();
        setNfts(updatedNfts);
        if (txHash !== undefined)
            showTx(txHash);



    }

    function startEditing(nft) {
        setEditingNft(nft.unit); // Utiliser unit comme identifiant unique
        // Pré-remplir avec le prix actuel
        const currentPrice = extractPriceFromDatum(nft.utxo);
        setNewPrice(currentPrice || "");
    }

    function cancelEditing() {
        setEditingNft(null);
        setNewPrice("");
    }

    // Fonction pour extraire le prix du datum
    function extractPriceFromDatum(utxo) {
        try {
            if (!utxo.datum) return null;

            const datum = Data.from(utxo.datum);
            if (datum && datum.fields && datum.fields.length >= 1) {
                const priceInLovelace = datum.fields[0];
                const priceInADA = Number(priceInLovelace) / 1_000_000;
                return priceInADA.toFixed(2);
            }
            return null;
        } catch (error) {
            console.error("Error extracting price:", error);
            return null;
        }
    }

    return (
        <div className="wrap">
            <header>
                <h1>NFT Marketplace</h1>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button className="btn">Create / Sell</button>
                    <span className="muted">{nfts.length} NFTs for sale</span>
                </div>
            </header>

            <div className="layout">
                <main className="card">
                    <h2 style={{ marginTop: 0 }}>NFT Listings</h2>

                    <div className="listings" aria-live="polite">
                        {nfts.length === 0 ? (
                            <div className="no-nfts">
                                <p>No NFTs currently for sale.</p>
                            </div>
                        ) : (
                            nfts.map((nft, index) => {
                                const price = extractPriceFromDatum(nft.utxo);

                                const isEditing = editingNft === nft.unit;

                                return (
                                    <article key={index} className="nft" aria-label={`NFT ${nft.assetName}`}>
                                        <div className="nft-media">
                                            <div style={{
                                                fontSize: "64px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                height: "100%"
                                            }}>
                                                {getNftEmoji(nft)}
                                            </div>
                                        </div>

                                        <div className="nft-body">
                                            <div className="meta">
                                                <div>
                                                    <div className="title">{nft.assetName}</div>

                                                </div>

                                                <div className="price">
                                                    {price ? `${price} ADA` : "Price not set"}
                                                </div>
                                            </div>

                                            <div className="muted" style={{ fontSize: 13 }}>
                                                Policy: {nft.policyId.slice(0, 8)}...
                                                {price && <span className="badge">For sale</span>}
                                                {nft.result && (<span className="badge owner-badge">Owned</span>)}
                                            </div>

                                            {isEditing ? (
                                                // Mode édition
                                                <div className="update-form">
                                                    <div className="form-row" style={{ marginBottom: "10px" }}>
                                                        <label>New Price (ADA):</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0.01"
                                                            value={newPrice}
                                                            onChange={(e) => setNewPrice(e.target.value)}
                                                            placeholder="Enter new price"
                                                            className="price-input"
                                                        />
                                                    </div>
                                                    <div className="controls">
                                                        <button
                                                            onClick={() => handleUpdate(nft)}
                                                            className="primary"
                                                            disabled={!newPrice || parseInt(newPrice) <= 0}
                                                        >
                                                            Confirm Update
                                                        </button>
                                                        <button
                                                            onClick={cancelEditing}
                                                            className="ghost"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                // Mode normal
                                                <div className="controls">
                                                    {price ? (
                                                        <>
                                                            <button onClick={() => handleBuy(nft)} className="primary">Buy</button>
                                                            <button onClick={() => startEditing(nft)} className="ghost">Update</button>
                                                            <button onClick={() => handleCancel(nft)} className="ghost">Cancel</button>
                                                        </>
                                                    ) : (
                                                        <button className="primary">Sell</button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </article>
                                );
                            })
                        )}
                    </div>
                </main>

                {/* <aside className="card sidebar" aria-label="Search and filters">
                    <h3>Search & Filters</h3>
                    <form action="#" onSubmit={(e) => e.preventDefault()}>
                        <div className="form-row">
                            <label htmlFor="q">Search</label>
                            <input id="q" type="text" placeholder="NFT name..." />
                        </div>

                        <div className="form-row">
                            <label htmlFor="sort">Sort</label>
                            <select id="sort">
                                <option>Latest</option>
                                <option>Price — Low to High</option>
                                <option>Price — High to Low</option>
                            </select>
                        </div>

                        <div style={{ marginTop: 24 }}>
                            <h4 style={{ margin: "0 0 8px 0" }}>Market Stats</h4>
                            <div className="stats">
                                <div className="stat-item">
                                    <span className="muted">Total NFTs:</span>
                                    <strong>{nfts.length}</strong>
                                </div>
                                <div className="stat-item">
                                    <span className="muted">For sale:</span>
                                    <strong>{nfts.filter(n => extractPriceFromDatum(n.utxo)).length}</strong>
                                </div>
                            </div>
                        </div>
                    </form>

                    <div style={{ marginTop: 24 }}>
                        <h4 style={{ margin: "0 0 8px 0" }}>Notes</h4>
                        <p className="muted">
                            Click "Update" to change the price of your listed NFT.
                            Only the seller can update or cancel a listing.
                        </p>
                    </div>
                </aside> */}
            </div>

            <footer className="muted">
                Connected to Cardano marketplace smart contract.
            </footer>
        </div>
    );
}

export default Home;