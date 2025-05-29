async function loadPeserta() {
const response = await fetch('../../api/peserta.js');
const data = await response.json();
const tableBody = document.getElementById('peserta-table-body');
tableBody.innerHTML = '';

data.forEach((peserta, index) => {
    const row = `
    <tr>
        <td>${index + 1}</td>
        <td>${peserta.name}</td>
        <td>${peserta.email}</td>
        <td>${peserta.instansi}</td>
        <td>${peserta.nomor}</td>
        <td><a href="${peserta.swpUrl}" target="_blank">SWP</a></td>
        <td><a href="${peserta.followUrl}" target="_blank">FOLLOW</a></td>
        <td>${peserta.timestamp}</td>
    </tr>
    `;
    tableBody.innerHTML += row;
    });
}

document.addEventListener('DOMContentLoaded', loadPeserta);