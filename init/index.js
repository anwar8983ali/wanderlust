const mongoose=require("mongoose");
const initData=require("./data.js");

const listing=require('../models/listing.js');

 const MONGO_URL="mongodb://127.0.0.1:27017/wanderlust";
    
  main()
  .then(()=>{
    console.log("connected to DB");
  }).catch(err=>{
    console.log(err);
  })

  async function main(){
    await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await listing.deleteMany({});
  const dataWithOwner = initData.data.map((obj) => ({
    ...obj,
    owner: "6885ae6a9da85abb810dfde4"
  }));
  await listing.insertMany(dataWithOwner);
  console.log("data was initialized");
};


initDB();
