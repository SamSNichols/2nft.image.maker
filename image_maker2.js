const express = require('express');
const Jimp = require('jimp');
const Web3 = require('web3');
const app = express();
const port = 3000;

const web3 = new Web3('https://goerli.infura.io/v3/d8f0cefaa1ac49c3824142a2700a83ef');

const contractAddress = '0xa65FDf0205a3BA492BcFF2c9100705681477eD46';
const contractAbi = [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint16","name":"tokenId_","type":"uint16"},{"indexed":false,"internalType":"string","name":"bio_","type":"string"}],"name":"BioChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint16","name":"tokenId_","type":"uint16"},{"indexed":false,"internalType":"string","name":"name_","type":"string"}],"name":"NameChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint16","name":"tokenId_","type":"uint16"},{"indexed":false,"internalType":"uint8","name":"traitNumber_","type":"uint8"},{"indexed":false,"internalType":"uint16","name":"traitValue_","type":"uint16"}],"name":"TraitChanged","type":"event"},{"inputs":[{"internalType":"uint16","name":"","type":"uint16"}],"name":"Bio","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint16","name":"","type":"uint16"}],"name":"Name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"admin","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint16","name":"tokenId_","type":"uint16"},{"internalType":"string","name":"bio_","type":"string"}],"name":"adminChangeBio","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint16","name":"tokenId_","type":"uint16"},{"internalType":"string","name":"name_","type":"string"}],"name":"adminChangeName","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint16","name":"tokenId_","type":"uint16"},{"internalType":"uint8","name":"traitNumber_","type":"uint8"},{"internalType":"uint16","name":"traitValue_","type":"uint16"}],"name":"adminChangeTrait","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getAllNamesAndBiosAndChara","outputs":[{"components":[{"internalType":"string","name":"names","type":"string"},{"internalType":"string","name":"bios","type":"string"},{"internalType":"uint16[6]","name":"traits","type":"uint16[6]"}],"internalType":"struct CharacterSetting.NamesAndBiosAndChara[1000]","name":"","type":"tuple[1000]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"address_","type":"address"},{"internalType":"bool","name":"bool_","type":"bool"}],"name":"setAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint16","name":"","type":"uint16"},{"internalType":"uint8","name":"","type":"uint8"}],"name":"traits","outputs":[{"internalType":"uint16","name":"","type":"uint16"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"new_","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}];

const contract = new web3.eth.Contract(contractAbi, contractAddress);

const traitBaseUrls = [
  'https://backend.opsumoclub.com/trait1/',
  'https://backend.opsumoclub.com/trait2/',
  'https://backend.opsumoclub.com/trait3/',
  'https://backend.opsumoclub.com/trait4/',
  'https://backend.opsumoclub.com/trait5/',
  'https://backend.opsumoclub.com/trait6/'
];

const dnaCombinations = require('./dnaCombinations');

async function fetchRequestedData() {
    try {
      return await contract.methods.getAllNamesAndBiosAndChara().call();
    } catch (error) {
      console.error('Error fetching requested data:', error);
      return null;
    }
  }  

  
async function getUpdatedDnaCombinations(id) {
    const requestedData = await fetchRequestedData();
  
    const defaultDna = dnaCombinations[id - 1];
  
    if (!requestedData) {
      return defaultDna;
    }
  
    const requestedDna = requestedData[id].traits;
  
    let updatedDna = defaultDna.map((val, index) => {

      return requestedDna[index] > 0 ? requestedDna[index] : val;
    });
  
    return updatedDna;
  }
  

function decodeNftId(id, dna) {
    if (id < 1 || id > dnaCombinations.length) {
      throw new Error('Invalid Token ID');
    }
    return dna.map((index, i) => `${traitBaseUrls[i]}${index}.png`);
  }
  

async function mergeImages(imageUrls) {
  const images = await Promise.all(imageUrls.map(url => Jimp.read(url)));
  const baseImage = images.shift();

  for (const image of images) {
    baseImage.composite(image, 0, 0);
  }

  return baseImage;
}


app.get('/:id.png', async (req, res) => {
    const id = parseInt(req.params.id, 10);
  
    try {
      const updatedDna = await getUpdatedDnaCombinations(id);
      const imageUrls = decodeNftId(id, updatedDna);
  
      const baseImage = await mergeImages(imageUrls);
      const pngBuffer = await baseImage.getBufferAsync(Jimp.MIME_PNG);
  
      res.set('Content-Type', 'image/png');
      res.send(pngBuffer);
    } catch (err) {
      console.error(err);
      if (err.message === 'Invalid Token ID') {
        res.status(404).send('Invalid Token ID');
      } else {
        res.status(500).send('Failed to generate Token image');
      }
    }
  });
  

app.listen(port, () => {
  console.log(`NFT API listening at http://localhost:${port}`);
});
