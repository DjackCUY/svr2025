async function loadPeserta() {
const response = await fetch('../../api/peserta.js');
const data = await response.json();
const tableBody = document.getElementById('peserta-table-body');
tableBody.innerHTML = '';

data.forEach((peserta, index) => {
    const row = `
    <tr>
        <td>${index + 1}</td>
        <td>${peserta.nama}</td>
        <td>${peserta.email}</td>
        <td>${peserta.instansi}</td>
        <td>${peserta.nomor}</td>
        <td>${peserta.swpUrl}</td>
        <td>${peserta.FollowUrl}</td>
        <td>${peserta.timestamp}</td>
    </tr>
    `;
    tableBody.innerHTML += row;
    });
}

document.addEventListener('DOMContentLoaded', loadPeserta);