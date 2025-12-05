import Swal from "sweetalert2";
export function showTx(txHash: string) {
    Swal.fire({
        title: "🎉Transaction Submitted Succesfully!",
        html: `
    <p>Your NFT has been listed for sale.</p>
    <p><strong>Tx On preprod:</strong></p>
    <a href="https://preprod.cexplorer.io/tx/${txHash}" target="_blank">
      https://preprod.cexplorer.io/tx/${txHash}
    </a>
  `,
        icon: "success",
        confirmButtonText: "OK"
    });

}

export function showErrorMsg(msg: string) {
    Swal.fire({
        title: "Error",
        html: `<p>${msg}</p>`,
        icon: "error",
        confirmButtonText: "OK"
    });

}