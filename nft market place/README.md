
````markdown
# NFT Marketplace Frontend Documentation

## 📘 Introduction
This frontend is built with **React** and interacts with a Cardano smart contract to allow users to manage NFTs.  
Users can **mint**, **sell**, **buy**, **update**, and **cancel** NFTs through a user-friendly interface.  

---

## ⚡ Getting Started

To launch the project locally:

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
````

The app will be available at `http://localhost:5173` (default Vite port).

---

## 🏠 Pages / Components Overview

### 1. **Home**

The `Home` component displays the user's NFTs and marketplace listings.
Users can perform the following actions:

* **Buy NFT**

  * Users can purchase NFTs listed for sale.
  * Requires entering a price and confirming the transaction.

* **Update NFT Price**

  * Owners can update the price of their NFTs.
  * The price input field must be filled before submitting the update.

* **Cancel NFT Sale**

  * Owners can cancel a sale to remove the NFT from the marketplace.

**Displayed Information for Each NFT:**

* Asset Name
* Policy ID (truncated)
* Price (if set)
* Ownership Badge (`Owned` if the NFT belongs to the connected wallet)
* Sale Status (`For sale` badge if listed)

---

### 2. **Mint**

The `Mint` component allows users to create a new NFT.

**Features:**

* Input field for NFT name.
* Minting button to submit the transaction.
* Displays transaction success or error via **SweetAlert** notifications.

---

### 3. **Sell**

The `Sell` component enables users to list their NFTs for sale.

**Features:**

* Input field for setting the sale price.
* Button to submit the sell transaction.
* Displays the transaction hash with a clickable link to **Cexplorer** (testnet / mainnet).

**Transaction Alerts:**

* Success:

```js
Swal.fire({
    title: "🎉 Sell Transaction Sent!",
    html: `<p>Your NFT has been listed for sale.</p>
           <p><strong>Tx Hash:</strong></p>
           <a href="https://preprod.cexplorer.io/tx/${txHash}" target="_blank">${txHash}</a>`,
    icon: "success",
    confirmButtonText: "OK"
});
```

* Error:

```js
Swal.fire({
    title: "Error",
    html: `<p>${msg}</p>`,
    icon: "error",
    confirmButtonText: "OK"
});
```

---

## 🛠️ Utilities

### `connectWallet`

* Connects to a Cardano wallet.
* Returns `walletAddress`, `lucid` instance, and `validatorAddress`.

### NFT Operations

* **Mint NFT:** `mintNft(name: string)`
* **Sell NFT:** `sellNft(price: number, nft: any)`
* **Buy NFT:** `buyNft(price: number, nft: any)`
* **Update NFT Price:** `updateNft(nft: any, newPrice: number)`
* **Cancel NFT Sale:** `cancelNft(nft: any)`

### Helpers

* `hexToString`: Converts hex representation of asset names to ASCII.
* `getAssetId(policyId, assetName)`: Generates the unique asset ID for an NFT.

---

## 📌 Example Flow

1. User connects wallet using `connectWallet`.
2. NFTs are fetched and displayed in **Home**.
3. User selects an NFT to:

   * Buy → triggers `buyNft`.
   * Update → triggers `updateNft`.
   * Cancel → triggers `cancelNft`.
4. Owner can go to **Sell** to list a new NFT for sale.
5. User can go to **Mint** to create a new NFT.
6. Transactions show alerts via **SweetAlert** with clickable Tx Hash.

---

**End of Documentation**

```

---

