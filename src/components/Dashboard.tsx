import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch, RootState } from "../redux/store";
import {
  bulkUploadImages,
  getUserUploads,
  editUpload,
  deleteUpload,
} from "../redux/actions/imageActions";
import { logout } from "../redux/reducers/userReducer";
import {
  Upload as UploadIcon,
  Edit3,
  Trash2,
  Image as ImageIcon,
  Plus,
  Search,
  User,
  LogOut,
  Grid,
  List,
  GripVertical,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { serverInstance } from "@/services";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmationModal from "./ConfirmationModal";
import ResetPassword from "./ResetPassword";
import { Lock } from "lucide-react";

interface Upload {
  id: string;
  title: string;
  imageUrl: string;
  order: number;
}

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "edit" | "delete" | "logout" | null
  >(null);
  const [selectedImage, setSelectedImage] = useState<Upload | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);

  // Fetch uploads on mount
  useEffect(() => {
    const fetchUploads = async () => {
      setLoading(true);
      try {
        const response = await dispatch(getUserUploads()).unwrap();
        setUploads(Array.isArray(response.uploads) ? response.uploads : []);
        setError(null);
        toast.success("Uploads loaded successfully");
      } catch (err) {
        console.error("[Dashboard] getUserUploads error:", {
          message: err.error?.message || "Failed to fetch uploads",
          status: err.response?.status,
          data: err.response?.data,
        });
        setError(err.error?.message || "Failed to fetch uploads");
        toast.error(err.error?.message || "Failed to fetch uploads");
        if (err.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUploads();
  }, [dispatch, navigate]);

  // Clean up object URLs for previews
  useEffect(() => {
    return () => {
      selectedFiles.forEach((file) =>
        URL.revokeObjectURL(URL.createObjectURL(file))
      );
      if (editImagePreview) URL.revokeObjectURL(editImagePreview);
    };
  }, [selectedFiles, editImagePreview]);

  // Handle bulk upload
  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) {
      setError("No files selected");
      toast.error("No files selected");
      return;
    }
    setLoading(true);
    try {
      const uploadData = selectedFiles.map((file, index) => ({
        title: titles[index] || `Image ${index + 1}`,
        image: file,
      }));
      const response = await dispatch(
        bulkUploadImages({ uploads: uploadData })
      ).unwrap();
      setUploads([...uploads, ...response.uploads]);
      setError(null);
      setSelectedFiles([]);
      setTitles([]);
      setShowUploadModal(false);
      toast.success("Images uploaded successfully");
    } catch (err) {
      console.error("[Dashboard] bulkUploadImages error:", {
        message: err.error?.message || "Bulk upload failed",
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(err.error?.message || "Bulk upload failed");
      toast.error(err.error?.message || "Bulk upload failed");
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection with validation
  const MAX_FILE_COUNT = 10;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; 
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > MAX_FILE_COUNT) {
      setError(`Maximum ${MAX_FILE_COUNT} files allowed`);
      toast.error(`Maximum ${MAX_FILE_COUNT} files allowed`);
      return;
    }
    const validFiles = files.filter((file) => file.size <= MAX_FILE_SIZE);
    if (validFiles.length !== files.length) {
      setError("Some files exceed 10MB limit");
      toast.error("Some files exceed 10MB limit");
    }
    setSelectedFiles(validFiles);
    setTitles(validFiles.map(() => ""));
  };

  // Handle file selection for edit modal
  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setError("File exceeds 10MB limit");
        toast.error("File exceeds 10MB limit");
        return;
      }
      if (editImagePreview) URL.revokeObjectURL(editImagePreview);
      setSelectedFiles([file]);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle title change
  const handleTitleChange = (index: number, value: string) => {
    const newTitles = [...titles];
    newTitles[index] = value;
    setTitles(newTitles);
  };

  // Handle drag-and-drop for selected files
  const handleFileDragEnd = (result) => {
    if (!result.destination) return;
    const newFiles = Array.from(selectedFiles);
    const newTitles = Array.from(titles);
    const [reorderedFile] = newFiles.splice(result.source.index, 1);
    const [reorderedTitle] = newTitles.splice(result.source.index, 1);
    newFiles.splice(result.destination.index, 0, reorderedFile);
    newTitles.splice(result.destination.index, 0, reorderedTitle);
    setSelectedFiles(newFiles);
    setTitles(newTitles);
  };

  // Handle edit upload
  const handleEditUpload = async () => {
    if (!selectedImage) {
      setError("No image selected for editing");
      toast.error("No image selected for editing");
      return;
    }
    setLoading(true);
    try {
      const updateData: { id: string; title?: string; image?: File } = {
        id: selectedImage.id,
        title: selectedImage.title,
      };
      if (selectedFiles[0]) {
        updateData.image = selectedFiles[0];
      }
      const response = await dispatch(editUpload(updateData)).unwrap();
      setUploads(
        uploads.map((upload) =>
          upload.id === response.upload.id ? response.upload : upload
        )
      );
      setError(null);
      setShowEditModal(false);
      setShowConfirmModal(false);
      setSelectedFiles([]);
      setSelectedImage(null);
      setEditImagePreview(null);
      toast.success("Image updated successfully");
    } catch (err) {
      console.error("[Dashboard] editUpload error:", {
        message: err.error?.message || "Edit upload failed",
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(err.error?.message || "Edit upload failed");
      toast.error(err.error?.message || "Edit upload failed");
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle delete upload
  const handleDeleteUpload = async (id: string) => {
    setLoading(true);
    try {
      await dispatch(deleteUpload({ id })).unwrap();
      setUploads(uploads.filter((upload) => upload.id !== id));
      setError(null);
      setShowConfirmModal(false);
      toast.success("Image deleted successfully");
    } catch (err) {
      console.error("[Dashboard] deleteUpload error:", {
        message: err.error?.message || "Delete upload failed",
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(err.error?.message || "Delete upload failed");
      toast.error(err.error?.message || "Delete upload failed");
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await serverInstance.post("/logout");
      dispatch(logout());
      navigate("/login");
      toast.success("Logged out successfully");
    } catch (err) {
      console.error("[Dashboard] Logout error:", {
        message: err.message || "Logout failed",
        status: err.response?.status,
        data: err.response?.data,
      });
      dispatch(logout());
      navigate("/login");
      toast.error("Logout failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mr-3">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Image Gallery
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.name || "Guest"}
                </span>
              </div>
              <button
                onClick={() => setShowResetPasswordModal(true)}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Reset Password"
              >
                <Lock className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setConfirmAction("logout");
                  setShowConfirmModal(true);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && <div className="text-center text-gray-600">Loading...</div>}
        {error && <div className="text-center text-red-600 mb-4">{error}</div>}

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Bulk Upload
            </button>
            <div className="text-sm text-gray-600">
              {uploads?.length || 0} images uploaded
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${
                  viewMode === "grid"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                } transition-colors`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${
                  viewMode === "list"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                } transition-colors`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {uploads
              .filter((upload) =>
                upload.title.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((upload) => (
                <div
                  key={upload.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group"
                >
                  <div className="relative">
                    <img
                      src={upload.imageUrl}
                      alt={upload.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={() => {
                            setSelectedImage(upload);
                            setShowEditModal(true);
                          }}
                          className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                        >
                          <Edit3 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmAction("delete");
                            setSelectedImage(upload);
                            setShowConfirmModal(true);
                          }}
                          className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 truncate">
                      {upload.title}
                    </h3>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">
                      Image
                    </th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">
                      Title
                    </th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {uploads
                    .filter((upload) =>
                      upload.title
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
                    )
                    .map((upload) => (
                      <tr
                        key={upload.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <img
                            src={upload.imageUrl}
                            alt={upload.title}
                            className="w-16 h-12 object-cover rounded-lg"
                          />
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-gray-900">
                            {upload.title}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedImage(upload);
                                setShowEditModal(true);
                              }}
                              className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setConfirmAction("delete");
                                setSelectedImage(upload);
                                setShowConfirmModal(true);
                              }}
                              className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bulk Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  Bulk Upload Images
                </h2>
                <p className="text-gray-600 mt-1">
                  Select images, set titles, and reorder them before uploading.
                </p>
              </div>
              <div className="p-6">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors relative mb-6">
                  <UploadIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Drop images here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Support: JPG, PNG, GIF (Max 10MB each, up to 10 images)
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Selected Images ({selectedFiles.length})
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 flex items-center">
                      <GripVertical className="w-5 h-5 mr-2 text-gray-500" />
                      Drag and drop to reorder images before uploading
                    </p>
                    <DragDropContext onDragEnd={handleFileDragEnd}>
                      <Droppable droppableId="selected-files">
                        {(provided) => (
                          <div
                            className="space-y-4"
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                          >
                            {selectedFiles.map((file, index) => (
                              <Draggable
                                key={`${file.name}-${index}`}
                                draggableId={`${file.name}-${index}`}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex items-center space-x-4 p-4 border border-gray-200 rounded-lg ${
                                      snapshot.isDragging
                                        ? "bg-blue-50 shadow-lg"
                                        : "bg-gray-50"
                                    } hover:border-blue-400 transition-all`}
                                  >
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-move"
                                    >
                                      <GripVertical className="w-5 h-5 text-gray-500 hover:text-blue-500" />
                                    </div>
                                    <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center">
                                      <img
                                        src={URL.createObjectURL(file)}
                                        alt={file.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        placeholder={`Image ${
                                          index + 1
                                        } title...`}
                                        value={titles[index] || ""}
                                        onChange={(e) =>
                                          handleTitleChange(
                                            index,
                                            e.target.value
                                          )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </div>
                                    <button
                                      onClick={() => {
                                        setSelectedFiles(
                                          selectedFiles.filter(
                                            (_, i) => i !== index
                                          )
                                        );
                                        setTitles(
                                          titles.filter((_, i) => i !== index)
                                        );
                                      }}
                                      className="p-2 text-red-500 hover:text-red-700 transition-colors"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFiles([]);
                    setTitles([]);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={loading || selectedFiles.length === 0}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50"
                >
                  {loading ? "Uploading..." : "Upload Images"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Edit Image</h2>
                <p className="text-gray-600 mt-1">Update image and title</p>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Preview
                  </label>
                  <div className="relative">
                    <img
                      src={editImagePreview || selectedImage.imageUrl}
                      alt={selectedImage.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      onChange={handleEditFileSelect}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label
                    htmlFor="edit-title"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Title
                  </label>
                  <input
                    id="edit-title"
                    type="text"
                    value={selectedImage.title || ""}
                    onChange={(e) =>
                      setSelectedImage({
                        ...selectedImage,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedFiles([]);
                    setSelectedImage(null);
                    setEditImagePreview(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setConfirmAction("edit");
                    setShowConfirmModal(true);
                  }}
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={() => {
            if (confirmAction === "edit") {
              handleEditUpload();
            } else if (confirmAction === "delete" && selectedImage) {
              handleDeleteUpload(selectedImage.id);
            } else if (confirmAction === "logout") {
              handleLogout();
            }
          }}
          title={
            confirmAction === "edit"
              ? "Confirm Edit"
              : confirmAction === "delete"
              ? "Confirm Delete"
              : "Confirm Logout"
          }
          message={
            confirmAction === "edit"
              ? "Are you sure you want to save changes to this image?"
              : confirmAction === "delete"
              ? "Are you sure you want to delete this image? This action cannot be undone."
              : "Are you sure you want to log out?"
          }
          confirmText={
            confirmAction === "edit"
              ? "Save"
              : confirmAction === "delete"
              ? "Delete"
              : "Logout"
          }
        />
        {showResetPasswordModal && (
          <ResetPassword onClose={() => setShowResetPasswordModal(false)} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
