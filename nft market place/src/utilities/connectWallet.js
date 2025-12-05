import { Lucid, Blockfrost, Constr, fromText, Data } from "https://unpkg.com/lucid-cardano@0.10.11/web/mod.js";
import { validatorCbor } from "./validator.js";
import { showErrorMsg } from "./showTx.js";

const BLOCKFROST_PROJECT_ID = "preprodYjRkHfcazNkL0xxG9C2RdUbUoTrG7wip";

export const validator = {
    type: "PlutusV2",
    script: validatorCbor.cborHex,
};

export async function connectWallet() {
    try {
        const lucid = await Lucid.new(
            new Blockfrost(
                "https://cardano-preprod.blockfrost.io/api/v0",
                BLOCKFROST_PROJECT_ID
            ),
            "Preprod"
        );

        let walletApi
        if (window.cardano?.lace) walletApi = await window.cardano.lace.enable();
        else if (window.cardano?.nami) walletApi = await window.cardano.nami.enable();
        else if (window.cardano?.eternl) walletApi = await window.cardano.eternl.enable();
        else {
            showErrorMsg("Install a Cardano wallet");
            return null;
        }

        lucid.selectWallet(walletApi);
        const walletAddress = await lucid.wallet.address();
        console.log("User address:", walletAddress);
        const validatorAddress = lucid.utils.validatorToAddress(validator);
        console.log("Validator address:", validatorAddress);
        return { walletAddress, lucid, validatorAddress };
    } catch (err) {
        showErrorMsg("Wallet connection error");
        return null;
    }
}

export async function getWalletNft() {
    let { lucid } = await connectWallet();
    const utxos = await lucid.wallet.getUtxos();
    const nfts = [];

    for (const utxo of utxos) {
        for (const unit in utxo.assets) {
            if (unit !== "lovelace" && utxo.assets[unit] === 1n) {
                const policyId = unit.slice(0, 56);
                const assetNameHex = unit.slice(56);
                const assetName = hexToString(assetNameHex);
                //betsoNft datum was bad formatted during selling, we exclude it
                if (assetName !== "betsoNft")
                    nfts.push({
                        unit,
                        policyId,
                        assetName,
                        utxo,
                    });
            }
        }
    }

    return nfts;


}


export async function sellNft(price, nft) {
    try {
        let { walletAddress, lucid, validatorAddress } = await connectWallet();
        const signerPubKeyHash =
            lucid.utils.getAddressDetails(walletAddress).paymentCredential.hash;
        // console.log({ signerPubKeyHash });
        const utxos = await lucid.wallet.getUtxos();
        const policyId = nft.policyId;
        const assetNameHex = fromText(nft.assetName);
        // console.log({ policyId, assetNameHex });

        const datum = Data.to(new Constr(0, [
            BigInt(price * 1_000_000),
            policyId,
            assetNameHex,
            signerPubKeyHash,
        ]));

        const tx = await lucid
            .newTx()
            .collectFrom(utxos)
            .payToContract(
                validatorAddress,
                {
                    inline: datum
                },
                {
                    [nft.unit]: 1n,
                    lovelace: 2_000_000n
                },
            )
            .addSignerKey(signerPubKeyHash)
            .complete();
        const signedTx = await tx.sign().complete();
        const txHash = await signedTx.submit();
        console.log("Sell transaction submitted with hash:", txHash);
        return txHash
        return txHash;
    } catch (error) {
        showErrorMsg("Transaction error")
        console.error("Error building sell transaction:", error);
    }

}

export async function mintNFT(assetName) {
    let { walletAddress, lucid } = await connectWallet();
    const signerPubKeyHash =
        lucid.utils.getAddressDetails(walletAddress).paymentCredential.hash;
    // console.log({ signerPubKeyHash });

    const mintingPolicy = lucid.utils.nativeScriptFromJson({
        type: "sig",
        keyHash: signerPubKeyHash,
    });

    const policyId = lucid.utils.mintingPolicyToId(mintingPolicy);
    const nftUnit = policyId + fromText(assetName);
    const value = { [nftUnit]: 1n };

    const metadata = {
        [policyId]: {
            [assetName]: {
                name: assetName,
                image: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG", // exemple d'image hébergée sur IPFS
                description: `${assetName} description`,
            }
        }
    };
    const tx = await lucid
        .newTx()
        .mintAssets(value)         // mint ton NFT
        .attachMintingPolicy(mintingPolicy)
        .attachMetadata(721, metadata)  // ajoute tes metadata
        .payToAddress(walletAddress, { lovelace: 2000000n }) // envoie à toi-même ou à un wallet
        .complete()

    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();
    console.log("✅ Token minted!");
    console.log("Tx hash:", txHash);
    console.log("Policy ID:", policyId);
    return txHash
}
// const addLiquidityBtn = document.getElementById("addLiqBtn");

// addLiquidityBtn.addEventListener("click", async () => {
//   const address = await connectWallet();
//   console.log(address);
//   await mint();
//   // addLiquidity(amountA, amountB, "", "", address);
// });

export function hexToString(hex) {
    let str = "";
    for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substring(i, 2 + i), 16));
    }
    return str;
}

export function getAassetId(policyId, assetName) {
    return policyId + fromText(assetName);
}

const emojis = [
    '😄', '😃', '😀', '😊', '☺', '😉', '😍', '😘', '😚', '😗', '😙', '😜', '😝', '😛', '😳', '😁', '😔', '😌', '😒', '😞', '😣', '😢', '😂', '😭', '😪', '😥', '😰', '😅', '😓', '😩', '😫', '😨', '😱', '😠', '😡', '😤', '😖', '😆', '😋', '😷', '😎', '😴', '😵', '😲', '😟', '😦', '😧', '😈', '👿', '😮', '😬', '😐', '😕', '😯', '😶', '😇', '😏', '😑', '👲', '👳', '👮', '👷', '💂', '👶', '👦', '👧', '👨', '👩', '👴', '👵', '👱', '👼', '👸', '😺', '😸', '😻', '😽', '😼', '🙀', '😿', '😹', '😾', '👹', '👺', '🙈', '🙉', '🙊', '💀', '👽', '💩', '🔥', '✨', '🌟', '💫', '💥', '💢', '💦', '💧', '💤', '💨', '👂', '👀', '👃', '👅', '👄', '👍', '👎', '👌', '👊', '✊', '✌', '👋', '✋', '👐', '👆', '👇', '👉', '👈', '🙌', '🙏', '☝', '👏', '💪', '🚶', '🏃', '💃', '👫', '👪', '👬', '👭', '💏', '💑', '👯', '🙆', '🙅', '💁', '🙋', '💆', '💇', '💅', '👰', '🙎', '🙍', '🙇', '🎩', '👑', '👒', '👟', '👞', '👡', '👠', '👢', '👕', '👔', '👚', '👗', '🎽', '👖', '👘', '👙', '💼', '👜', '👝', '👛', '👓', '🎀', '🌂', '💄', '💛', '💙', '💜', '💚', '❤', '💔', '💗', '💓', '💕', '💖', '💞', '💘', '💌', '💋', '💍', '💎', '👤', '👥', '💬', '👣', '💭', '🐶', '🐺', '🐱', '🐭', '🐹', '🐰', '🐸', '🐯', '🐨', '🐻', '🐷', '🐽', '🐮', '🐗', '🐵', '🐒', '🐴', '🐑', '🐘', '🐼', '🐧', '🐦', '🐤', '🐥', '🐣', '🐔', '🐍', '🐢', '🐛', '🐝', '🐜', '🐞', '🐌', '🐙', '🐚', '🐠', '🐟', '🐬', '🐳', '🐋', '🐄', '🐏', '🐀', '🐃', '🐅', '🐇', '🐉', '🐎', '🐐', '🐓', '🐕', '🐖', '🐁', '🐂', '🐲', '🐡', '🐊', '🐫', '🐪', '🐆', '🐈', '🐩', '🐾', '💐', '🌸', '🌷', '🍀', '🌹', '🌻', '🌺', '🍁', '🍃', '🍂', '🌿', '🌾', '🍄', '🌵', '🌴', '🌲', '🌳', '🌰', '🌱', '🌼', '🌐', '🌞', '🌝', '🌚', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌜', '🌛', '🌙', '🌍', '🌎', '🌏', '🌋', '🌌', '🌠', '⭐', '☀', '⛅', '☁', '⚡', '☔', '❄', '⛄', '🌀', '🌁', '🌈', '🌊', '🎍', '💝', '🎎', '🎒', '🎓', '🎏', '🎆', '🎇', '🎐', '🎑', '🎃', '👻', '🎅', '🎄', '🎁', '🎋', '🎉', '🎊', '🎈', '🎌', '🔮', '🎥', '📷', '📹', '📼', '💿', '📀', '💽', '💾', '💻', '📱', '☎', '📞', '📟', '📠', '📡', '📺', '📻', '🔊', '🔉', '🔈', '🔇', '🔔', '🔕', '📢', '📣', '⏳', '⌛', '⏰', '⌚', '🔓', '🔒', '🔏', '🔐', '🔑', '🔎', '💡', '🔦', '🔆', '🔅', '🔌', '🔋', '🔍', '🛁', '🛀', '🚿', '🚽', '🔧', '🔩', '🔨', '🚪', '🚬', '💣', '🔫', '🔪', '💊', '💉', '💰', '💴', '💵', '💷', '💶', '💳', '💸', '📲', '📧', '📥', '📤', '✉', '📩', '📨', '📯', '📫', '📪', '📬', '📭', '📮', '📦', '📝', '📄', '📃', '📑', '📊', '📈', '📉', '📜', '📋', '📅', '📆', '📇', '📁', '📂', '✂', '📌', '📎', '✒', '✏', '📏', '📐', '📕', '📗', '📘', '📙', '📓', '📔', '📒', '📚', '📖', '🔖', '📛', '🔬', '🔭', '📰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🎹', '🎻', '🎺', '🎷', '🎸', '👾', '🎮', '🃏', '🎴', '🀄', '🎲', '🎯', '🏈', '🏀', '⚽', '⚾', '🎾', '🎱', '🏉', '🎳', '⛳', '🚵', '🚴', '🏁', '🏇', '🏆', '🎿', '🏂', '🏊', '🏄', '🎣', '☕', '🍵', '🍶', '🍼', '🍺', '🍻', '🍸', '🍹', '🍷', '🍴', '🍕', '🍔', '🍟', '🍗', '🍖', '🍝', '🍛', '🍤', '🍱', '🍣', '🍥', '🍙', '🍘', '🍚', '🍜', '🍲', '🍢', '🍡', '🍳', '🍞', '🍩', '🍮', '🍦', '🍨', '🍧', '🎂', '🍰', '🍪', '🍫', '🍬', '🍭', '🍯', '🍎', '🍏', '🍊', '🍋', '🍒', '🍇', '🍉', '🍓', '🍑', '🍈', '🍌', '🍐', '🍍', '🍠', '🍆', '🍅', '🌽', '🏠', '🏡', '🏫', '🏢', '🏣', '🏥', '🏦', '🏪', '🏩', '🏨', '💒', '⛪', '🏬', '🏤', '🌇', '🌆', '🏯', '🏰', '⛺', '🏭', '🗼', '🗾', '🗻', '🌄', '🌅', '🌃', '🗽', '🌉', '🎠', '🎡', '⛲', '🎢', '🚢', '⛵', '🚤', '🚣', '⚓', '🚀', '✈', '💺', '🚁', '🚂', '🚊', '🚉', '🚞', '🚆', '🚄', '🚅', '🚈', '🚇', '🚝', '🚋', '🚃', '🚎', '🚌', '🚍', '🚙', '🚘', '🚗', '🚕', '🚖', '🚛', '🚚', '🚨', '🚓', '🚔', '🚒', '🚑', '🚐', '🚲', '🚡', '🚟', '🚠', '🚜', '💈', '🚏', '🎫', '🚦', '🚥', '⚠', '🚧', '🔰', '⛽', '🏮', '🎰', '♨', '🗿', '🎪', '🎭', '📍', '🚩', '⬆', '⬇', '⬅', '➡', '🔠', '🔡', '🔤', '↗', '↖', '↘', '↙', '↔', '↕', '🔄', '◀', '▶', '🔼', '🔽', '↩', '↪', 'ℹ', '⏪', '⏩', '⏫', '⏬', '⤵', '⤴', '🆗', '🔀', '🔁', '🔂', '🆕', '🆙', '🆒', '🆓', '🆖', '📶', '🎦', '🈁', '🈯', '🈳', '🈵', '🈴', '🈲', '🉐', '🈹', '🈺', '🈶', '🈚', '🚻', '🚹', '🚺', '🚼', '🚾', '🚰', '🚮', '🅿', '♿', '🚭', '🈷', '🈸', '🈂', 'Ⓜ', '🛂', '🛄', '🛅', '🛃', '🉑', '㊙', '㊗', '🆑', '🆘', '🆔', '🚫', '🔞', '📵', '🚯', '🚱', '🚳', '🚷', '🚸', '⛔', '✳', '❇', '❎', '✅', '✴', '💟', '🆚', '📳', '📴', '🅰', '🅱', '🆎', '🅾', '💠', '➿', '♻', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '⛎', '🔯', '🏧', '💹', '💲', '💱', '©', '®', '™', '〽', '〰', '🔝', '🔚', '🔙', '🔛', '🔜', '❌', '⭕', '❗', '❓', '❕', '❔', '🔃', '🕛', '🕧', '🕐', '🕜', '🕑', '🕝', '🕒', '🕞', '🕓', '🕟', '🕔', '🕠', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '✖', '➕', '➖', '➗', '♠', '♥', '♣', '♦', '💮', '💯', '✔', '☑', '🔘', '🔗', '➰', '🔱', '🔲', '🔳', '◼', '◻', '◾', '◽', '▪', '▫', '🔺', '⬜', '⬛', '⚫', '⚪', '🔴', '🔵', '🔻', '🔶', '🔷', '🔸', '🔹'
];

export function getNftEmoji(nft) {
    // Utiliser le policyId ou assetName pour générer un emoji déterministe
    const seed = nft.unit

    // Convertir la seed en nombre
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0; // Convertir en entier 32-bit
    }

    // Prendre la valeur absolue et modulo le nombre d'emojis
    const index = Math.abs(hash) % emojis.length;
    return emojis[index];
}



export async function getValidatorNfts() {
    let { lucid, walletAddress, validatorAddress } = await connectWallet();
    const utxos = await lucid.utxosAt(validatorAddress);
    const signerPubKeyHash =
        lucid.utils.getAddressDetails(walletAddress).paymentCredential.hash;
    const reconstitutedAddress = lucid.utils.credentialToAddress({
        hash: signerPubKeyHash,
        type: "Key"
    });
    // console.log("UTxOs at validator address:", utxos);
    const nfts = [];
    let sellerAddress;
    let result = false
    for (const utxo of utxos) {
        for (const unit in utxo.assets) {
            if (unit !== "lovelace" && utxo.assets[unit] === 1n) {
                const policyId = unit.slice(0, 56);
                const assetNameHex = unit.slice(56);
                const assetName = hexToString(assetNameHex);
                // console.log("datum is", utxo.datum)
                // console.log("datum decoded is", Data.from(utxo.datum!));
                //betsoNft datum was bad formatted during selling, we exclude it
                let datum = Data.from(utxo.datum);
                let sellerPubKeyHash = datum.fields[3];
                console.log("sellerPubKeyHash is", sellerPubKeyHash);
                sellerAddress = lucid.utils.credentialToAddress({
                    hash: sellerPubKeyHash,
                    type: "Key"
                });
                if (sellerAddress === reconstitutedAddress)
                    result = true;
                else
                    result = false;
                // console.log("seller address is", sellerAddress);
                if (assetName !== "betsoNft")
                    nfts.push({
                        unit,
                        policyId,
                        assetName,
                        utxo,
                        result
                    });
            }
        }
    }

    return nfts;
}

export async function buyNft(price, nft) {
    try {
        let { walletAddress, lucid, validatorAddress } = await connectWallet();
        const signerPubKeyHash =
            lucid.utils.getAddressDetails(walletAddress).paymentCredential.hash;
        // console.log({ signerPubKeyHash });
        const utxos = await lucid.wallet.getUtxos();
        const scriptUtxo = nft.utxo; // UTxO du NFT à acheter
        // console.log("scriptUtxo is", scriptUtxo);
        const decodedDatum = Data.from(scriptUtxo.datum);
        // console.log("decoded datum is", decodedDatum);
        const policyId = nft.policyId;
        const assetNameHex = fromText(nft.assetName);
        // console.log({ policyId, assetNameHex });

        // const datum = Data.to(new Constr(0, [
        //     BigInt(price * 1_000_000),
        //     policyId,
        //     assetNameHex,
        //     signerPubKeyHash,
        // ]));

        const redeemer = Data.to(new Constr(1, [
            signerPubKeyHash
        ]));

        const sellerAddress = lucid.utils.credentialToAddress({
            hash: decodedDatum.fields[3],
            type: "Key"
        });

        // console.log({ sellerAddress });

        const tx = await lucid
            .newTx()
            .collectFrom(utxos)
            .collectFrom([scriptUtxo], redeemer)
            .payToAddress(
                walletAddress,
                {
                    [nft.unit]: 1n,
                    lovelace: 2_000_000n
                },
            )
            .payToAddress(
                sellerAddress,
                {
                    lovelace: BigInt(price * 1_000_000),
                },
            )
            .attachSpendingValidator(validator)
            .addSignerKey(signerPubKeyHash)
            .complete();
        const signedTx = await tx.sign().complete();
        const txHash = await signedTx.submit();
        console.log("Buy transaction submitted with hash:", txHash);
        return txHash
        return txHash;
    } catch (error) {
        showErrorMsg("Transaction error")
        console.error("Error building buy transaction:", error);
    }

}


export async function cancelNft(nft) {
    try {
        let { walletAddress, lucid } = await connectWallet();
        const signerPubKeyHash =
            lucid.utils.getAddressDetails(walletAddress).paymentCredential.hash;
        // console.log({ signerPubKeyHash });
        const utxos = await lucid.wallet.getUtxos();
        const scriptUtxo = nft.utxo; // UTxO du NFT à acheter
        // console.log("scriptUtxo is", scriptUtxo);
        const decodedDatum = Data.from(scriptUtxo.datum);
        // console.log("decoded datum is", decodedDatum);

        const redeemer = Data.to(new Constr(3, []));
        const tx = await lucid
            .newTx()
            .collectFrom(utxos)
            .collectFrom([scriptUtxo], redeemer)
            .payToAddress(
                walletAddress,
                {
                    [nft.unit]: 1n,
                    lovelace: 2_000_000n
                },
            )
            .attachSpendingValidator(validator)
            .addSignerKey(signerPubKeyHash)
            .complete();
        const signedTx = await tx.sign().complete();
        const txHash = await signedTx.submit();
        // console.log("Buy transaction submitted with hash:", txHash);
        return txHash;
    } catch (error) {
        showErrorMsg("You're not the seller, cannot cancel")
        console.error("Error building buy transaction:", error);
    }

}



export async function updateNft(newPrice, nft) {
    try {
        let { walletAddress, lucid, validatorAddress } = await connectWallet();
        const signerPubKeyHash =
            lucid.utils.getAddressDetails(walletAddress).paymentCredential.hash;
        // console.log({ signerPubKeyHash });
        const utxos = await lucid.wallet.getUtxos();
        const scriptUtxo = nft.utxo; // UTxO du NFT à acheter
        // console.log("scriptUtxo is", scriptUtxo);
        const decodedDatum = Data.from(scriptUtxo.datum);
        // console.log("decoded datum is", decodedDatum);
        const policyId = nft.policyId;
        const assetNameHex = fromText(nft.assetName);

        const newDatum = Data.to(new Constr(0, [
            BigInt(newPrice * 1_000_000),
            policyId,
            assetNameHex,
            signerPubKeyHash,
        ]));
        const redeemer = Data.to(new Constr(2, [
            BigInt(newPrice * 1_000_000)
        ]));
        const tx = await lucid
            .newTx()
            .collectFrom(utxos)
            .collectFrom([scriptUtxo], redeemer)
            .payToContract(
                validatorAddress,
                {
                    inline: newDatum
                },
                {
                    [nft.unit]: 1n,
                    lovelace: 2_000_000n
                },
            )
            .attachSpendingValidator(validator)
            .addSignerKey(signerPubKeyHash)
            .complete();
        const signedTx = await tx.sign().complete();
        const txHash = await signedTx.submit();
        console.log("Buy transaction submitted with hash:", txHash);
        return txHash;
    } catch (error) {
        showErrorMsg("You're not the seller, cannot update")
        console.error("Error building buy transaction:", error);
    }

}