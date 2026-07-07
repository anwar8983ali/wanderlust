const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const Review=require("./review");
const listingSchema=new Schema({
    title:{
        type:String,
        required:true,
    },
    description:String,
    image:{
        filename: String,
        url:String,
    },
    images:[{
        filename: String,
        url: String
    }],
    price:Number,
    location:String,
    country:String,
    geometry:{
        type:{
            type:String,
            enum:['Point'],
            default:'Point'
        },
        coordinates:{
            type:[Number],
            default:[0,0]
        }
    },
    totalSpots:{
        type:Number,
        default:1,
        min:1
    },
    category:{
        type:String,
        enum:["Trending", "Rooms", "Iconic cities", "Mountains", "Castles", "Amazing pools", "Farms", "Camping", "Arctic", "Domes", "Boats"],
        default:"Trending"
    },
    reviewSummary:{
        type:String,
        default:""
    },
    reviewSummaryCount:{
        type:Number,
        default:0
    },
    reviews:[{
        type:Schema.Types.ObjectId,
        ref:"Review",
}],
   owner:{
    type:Schema.Types.ObjectId,
    ref:"User",
   }
})

listingSchema.index({ geometry: "2dsphere" });

listingSchema.post("findOneAndDelete",async(listing)=>{
    if(listing){
     await Review.deleteMany({_id:{$in:listing.reviews}});
    }
})
const listing=mongoose.model('listing',listingSchema);
module.exports=listing;
