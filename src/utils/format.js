function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
}

function convertSlashDate(stringDate) {
  let date = stringDate.substring(0, stringDate.indexOf(' ')).split('-');
  return `${date[2]}/${[date[1]]}/${date[0]}`;
}

module.exports = { formatNumber, convertSlashDate };
