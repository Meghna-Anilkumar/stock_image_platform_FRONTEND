export interface IEndPoints {
    login: string;
    logout: string;
}

export interface UserEndpoints extends IEndPoints {
    signup: string;
    resetPassword:string
}


export interface ImageEndpoints extends IEndPoints {
  bulkUpload: string;
  getUploads: string;
  editUpload: string;
  deleteUpload: string;
  rearrangeUploads: string;
}