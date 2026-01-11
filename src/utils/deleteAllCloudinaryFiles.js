// // This file is created for deleting all cloudinary assets during testing or development
// import cloudinary from '../config/cloudinary.js';
// import { MediaAsset } from '../models/MediaAsset.js';
// import Playlist from '../models/Playlist.js';
// import Device from '../models/Device.js';
// import User from '../models/User.js';
// export const deleteAllCloudinaryFiles = async () => {
//   try {
//     const resources = await cloudinary.api.resources({ max_results: 500 });
//     const publicIds = resources.resources.map((file) => file.public_id);
//     if (publicIds.length > 0) {
//       await cloudinary.api.delete_resources(publicIds);
//       console.log(`Deleted ${publicIds.length} files from Cloudinary.`);
//     } else {
//       console.log('No files to delete from Cloudinary.');
//     }
//     // clear all the db entries as well
//     await MediaAsset.deleteMany({});
//     await User.deleteMany({});
//     await Playlist.deleteMany({});
//     await Device.deleteMany({});
//     console.log('Cleared MediaAsset collection in the database.');
//   } catch (error) {
//     console.error('Error deleting files from Cloudinary:', error);
//   }
// };