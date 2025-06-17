import { UserEndpoints, ImageEndpoints } from "./IEndPoints";

export const userEndPoints: UserEndpoints = {
  signup: '/signup',
  login: '/login',
  logout: '/logout',
  resetPassword:'/reset-password'
}


export const imageEndPoints: ImageEndpoints = {
  login: '/login',
  logout: '/logout',
  bulkUpload: '/uploads',
  getUploads: '/uploads',
  editUpload: '/uploads/:id',
  deleteUpload: '/uploads/:id',
  rearrangeUploads: '/uploads/rearrange',
};