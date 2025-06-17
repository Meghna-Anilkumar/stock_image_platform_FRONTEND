import { createAsyncThunk } from '@reduxjs/toolkit';
import { serverInstance } from '@/services';
import { AxiosError } from 'axios';
import { imageEndPoints } from '@/services/endPoints/endPoints';

// Input interfaces
interface IBulkUploadInput {
  uploads: Array<{
    title: string;
    image: File; // File object instead of Base64
  }>;
}

interface IEditUploadInput {
  id: string;
  title?: string;
  image?: File; // File object instead of Base64
}

interface IDeleteUploadInput {
  id: string;
}

interface IRearrangeUploadsInput {
  order: string[]; // Array of upload IDs
}

// Response interfaces matching backend
interface Upload {
  id: string;
  title: string;
  imageUrl: string;
  order: number;
}

interface BulkUploadResponse {
  message: string;
  uploads: Upload[];
}

interface GetUploadsResponse {
  message: string;
  uploads: Upload[];
}

interface EditUploadResponse {
  message: string;
  upload: Upload;
}

interface DeleteUploadResponse {
  message: string;
}

interface RearrangeUploadsResponse {
  message: string;
}

// Thunk for bulk upload
export const bulkUploadImages = createAsyncThunk<BulkUploadResponse, IBulkUploadInput>(
  'images/bulkUpload',
  async (uploadData: IBulkUploadInput, { rejectWithValue }) => {
    console.log('[imageActions] Sending bulk upload request:', { fileCount: uploadData.uploads.length });
    console.log('[imageActions] Endpoint:', imageEndPoints.bulkUpload);
    try {
      const formData = new FormData();
      const titles: string[] = [];

      uploadData.uploads.forEach((upload, index) => {
        formData.append('images', upload.image);
        titles.push(upload.title);
        console.log('[imageActions] Appending file:', {
          name: upload.image.name,
          size: upload.image.size,
          title: upload.title,
        });
      });

      formData.append('titles', JSON.stringify(titles));
      console.log('[imageActions] FormData prepared:', { titles: titles.length, images: uploadData.uploads.length });

      const response = await serverInstance.post<BulkUploadResponse>(imageEndPoints.bulkUpload, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('[imageActions] Bulk upload response:', response.data);
      return response.data;
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      console.error('[imageActions] Bulk upload request error:', error.message, {
        message: error.response?.data?.message || 'Bulk upload failed',
        status: error.response?.status,
        data: error.response?.data,
      });
      return rejectWithValue({
        error: { message: error.response?.data?.message || 'Bulk upload failed' },
      });
    }
  }
);

// Thunk for getting user uploads
export const getUserUploads = createAsyncThunk<GetUploadsResponse, void>(
  'images/getUploads',
  async (_, { rejectWithValue }) => {
    console.log('[imageActions] Sending get uploads request');
    console.log('[imageActions] Endpoint:', imageEndPoints.getUploads);
    try {
      const response = await serverInstance.get<GetUploadsResponse>(imageEndPoints.getUploads);
      console.log('[imageActions] Get uploads response:', response.data);
      return response.data;
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      console.error('[imageActions] Get uploads request error:', error.message, {
        message: error.response?.data?.message || 'Failed to fetch uploads',
      });
      return rejectWithValue({
        error: { message: error.response?.data?.message || 'Failed to fetch uploads' },
      });
    }
  }
);

// Thunk for editing an upload
export const editUpload = createAsyncThunk<EditUploadResponse, IEditUploadInput>(
  'images/editUpload',
  async ({ id, title, image }: IEditUploadInput, { rejectWithValue }) => {
    console.log('[imageActions] Sending edit upload request:', { id, title, hasImage: !!image });
    console.log('[imageActions] Endpoint:', imageEndPoints.editUpload.replace(':id', id));
    
    // Validate ID
    if (!id || id === 'undefined' || id === 'null') {
      console.error('[imageActions] Invalid ID provided:', id);
      return rejectWithValue({
        error: { message: 'Invalid upload ID' },
      });
    }
    
    try {
      const formData = new FormData();
      if (title) formData.append('title', title);
      if (image) formData.append('image', image);

      const response = await serverInstance.put<EditUploadResponse>(
        imageEndPoints.editUpload.replace(':id', id),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      console.log('[imageActions] Edit upload response:', response.data);
      return response.data;
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      console.error('[imageActions] Edit upload request error:', error.message, {
        message: error.response?.data?.message || 'Edit upload failed',
        id,
        status: error.response?.status,
        data: error.response?.data,
      });
      return rejectWithValue({
        error: { message: error.response?.data?.message || 'Edit upload failed' },
      });
    }
  }
);

// Thunk for deleting an upload
export const deleteUpload = createAsyncThunk<DeleteUploadResponse, IDeleteUploadInput>(
  'images/deleteUpload',
  async ({ id }: IDeleteUploadInput, { rejectWithValue }) => {
    console.log('[imageActions] Sending delete upload request for ID:', id);
    console.log('[imageActions] Endpoint:', imageEndPoints.deleteUpload.replace(':id', id));
    
    // Validate ID
    if (!id || id === 'undefined' || id === 'null') {
      console.error('[imageActions] Invalid ID provided:', id);
      return rejectWithValue({
        error: { message: 'Invalid upload ID' },
      });
    }
    
    try {
      const response = await serverInstance.delete<DeleteUploadResponse>(
        imageEndPoints.deleteUpload.replace(':id', id)
      );
      console.log('[imageActions] Delete upload response:', response.data);
      return response.data;
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      console.error('[imageActions] Delete upload request error:', error.message, {
        message: error.response?.data?.message || 'Delete upload failed',
      });
      return rejectWithValue({
        error: { message: error.response?.data?.message || 'Delete upload failed' },
      });
    }
  }
);

// Thunk for rearranging uploads
export const rearrangeUploads = createAsyncThunk<RearrangeUploadsResponse, IRearrangeUploadsInput>(
  'images/rearrangeUploads',
  async (rearrangeData: IRearrangeUploadsInput, { rejectWithValue }) => {
    console.log('[imageActions] Sending rearrange uploads request:', rearrangeData);
    console.log('[imageActions] Endpoint:', imageEndPoints.rearrangeUploads);
    try {
      const response = await serverInstance.post<RearrangeUploadsResponse>(
        imageEndPoints.rearrangeUploads,
        rearrangeData
      );
      console.log('[imageActions] Rearrange uploads response:', response.data);
      return response.data;
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      console.error('[imageActions] Rearrange uploads request error:', error.message, {
        message: error.response?.data?.message || 'Rearrange uploads failed',
      });
      return rejectWithValue({
        error: { message: error.response?.data?.message || 'Rearrange uploads failed' },
      });
    }
  }
);