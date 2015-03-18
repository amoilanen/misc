function uuid() {

  function randomHex() {
    return (Math.floor(Math.random() * 16)).toString(16);
  }

  var uuidTemplate = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

  return uuidTemplate.replace(/x/g, function(match) {
    return randomHex();
  });
}

console.log(uuid());
