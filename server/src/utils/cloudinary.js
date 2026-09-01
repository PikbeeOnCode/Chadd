import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadOnCloudinary = async(localFilePath) => {
    try{
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        })
    
        fs.unlinkSync(localFilePath) // delete file after successful upload
        return response
    }catch(error){
        fs.unlinkSync(localFilePath) // delete file if upload fails
        return null
    }
}

const getPublicId = (url) => {
    if(!url) return null
    return url.split("/").pop().split(".")[0]
}

// delete image from cloudinary
const deleteImageFromCloudinary = async(url) => {
    try{
        if(!url) return null
        const publicId = getPublicId(url)
        await cloudinary.uploader.destroy(publicId)
        console.log("Image deleted from cloudinary:", publicId)
    }catch(error){
        console.log("Error deleting image from cloudinary:", error)
    }
}

// delete video from cloudinary
const deleteVideoFromCloudinary = async(url) => {
    try{
        if(!url) return null
        const publicId = getPublicId(url)
        await cloudinary.uploader.destroy(publicId, { resource_type: "video" })
        console.log("Video deleted from cloudinary:", publicId)
    }catch(error){
        console.log("Error deleting video from cloudinary:", error)
    }
}

export { uploadOnCloudinary, deleteImageFromCloudinary, deleteVideoFromCloudinary }