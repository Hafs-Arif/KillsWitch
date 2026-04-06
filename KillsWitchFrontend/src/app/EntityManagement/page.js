"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Database,
  Tag,
  Layers,
  Grid3X3,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { BASE_URL } from "../api/api";
import Navbar from "../component/HomeComponents/Navbar";
import Footer from "../component/HomeComponents/Footer";
import RouteGuard from "../components/RouteGuard";

const EntityManagement = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("brands");
  const [entities, setEntities] = useState({
    brands: [],
    categories: [],
    subcategories: [],
    brandCategories: [],
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const tabs = [
    { id: "brands", label: "Brands", icon: Tag, color: "purple" },
    { id: "categories", label: "Categories", icon: Layers, color: "blue" },
    {
      id: "subcategories",
      label: "Subcategories",
      icon: Database,
      color: "green",
    },
    {
      id: "brandCategories",
      label: "Brand Categories",
      icon: Grid3X3,
      color: "orange",
    },
  ];

  // UPDATED: Removed brand_image field completely
  const entityConfigs = {
    brands: {
      fields: [
        { name: "brand_id", label: "Brand ID", type: "number", required: true },
        {
          name: "brand_name",
          label: "Brand Name",
          type: "text",
          required: true,
        },
      ],
      displayFields: ["brand_id", "brand_name"],
      endpoint: "brands",
    },
    categories: {
      fields: [
        {
          name: "product_category_id",
          label: "Category ID",
          type: "number",
          required: true,
        },
        {
          name: "category_name",
          label: "Category Name",
          type: "text",
          required: true,
        },
      ],
      displayFields: ["product_category_id", "category_name"],
      endpoint: "categories",
    },
    subcategories: {
      fields: [
        {
          name: "sub_category_id",
          label: "Subcategory ID",
          type: "number",
          required: true,
        },
        {
          name: "sub_category_name",
          label: "Subcategory Name",
          type: "text",
          required: true,
        },
      ],
      displayFields: ["sub_category_id", "sub_category_name"],
      endpoint: "subcategories",
    },
    brandCategories: {
      fields: [
        { name: "id", label: "ID", type: "number", required: true },
        {
          name: "brand_id",
          label: "Brand ID",
          type: "select",
          required: true,
          options: "brands",
        },
        {
          name: "category_id",
          label: "Category ID",
          type: "select",
          required: true,
          options: "categories",
        },
        {
          name: "sub_category_id",
          label: "Subcategory ID",
          type: "select",
          required: true,
          options: "subcategories",
        },
      ],
      displayFields: [
        "id",
        "brand.brand_name",
        "category.category_name",
        "subcategory.sub_category_name",
      ],
      endpoint: "brand-categories",
    },
  };

  // Fetch entities
  const fetchEntities = async (entityType) => {
    try {
      setLoading(true);
      const config = entityConfigs[entityType];
      const response = await fetch(
        `${BASE_URL}/brand/manage/${config.endpoint}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ${entityType}`);
      }

      const data = await response.json();
      setEntities((prev) => ({ ...prev, [entityType]: data }));
    } catch (err) {
      setError(`Error fetching ${entityType}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all entities
  const fetchAllEntities = async () => {
    await Promise.all([
      fetchEntities("brands"),
      fetchEntities("categories"),
      fetchEntities("subcategories"),
      fetchEntities("brandCategories"),
    ]);
  };

  useEffect(() => {
    fetchAllEntities();
  }, []);

  // UPDATED: Handle form submission - removed file upload logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const config = entityConfigs[activeTab];
      const url = editingEntity
        ? `${BASE_URL}/brand/manage/${config.endpoint}/${
            editingEntity.id || editingEntity[config.displayFields[0]]
          }`
        : `${BASE_URL}/brand/manage/${config.endpoint}`;

      const method = editingEntity ? "PUT" : "POST";

      // Always use JSON - no file uploads anymore
      const headers = {
        "Content-Type": "application/json",
        'Accept': 'application/json'
      };
      
      const dataToSend = { ...formData };
      // Remove any file-related fields if they exist (cleanup)
      delete dataToSend.brand_image;
      delete dataToSend.brand_image_url;
      
      const requestBody = JSON.stringify(dataToSend);

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers,
        body: requestBody,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to ${editingEntity ? "update" : "create"} ${activeTab}`
        );
      }

      const result = await response.json();
      setSuccess(result.message);
      setShowForm(false);
      setEditingEntity(null);
      setFormData({});
      await fetchEntities(activeTab);
      
      // Trigger Admin page refresh
      localStorage.setItem('entityManagement_update', Date.now().toString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (entity) => {
    if (
      !confirm(
        `Are you sure you want to delete this ${activeTab.slice(0, -1)}?`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const config = entityConfigs[activeTab];
      const id = entity.id || entity[config.displayFields[0]];

      const response = await fetch(
        `${BASE_URL}/brand/manage/${config.endpoint}/${id}`,
        {
          method: "DELETE",
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete ${activeTab}`);
      }

      const result = await response.json();
      setSuccess(result.message);
      await fetchEntities(activeTab);
      
      // Trigger Admin page refresh
      localStorage.setItem('entityManagement_update', Date.now().toString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (entity) => {
    setEditingEntity(entity);
    const config = entityConfigs[activeTab];
    const initialData = {};

    config.fields.forEach((field) => {
      if (field.name.includes(".")) {
        const parts = field.name.split(".");
        initialData[field.name] = entity[parts[0]]?.[parts[1]] || "";
      } else {
        initialData[field.name] = entity[field.name] || "";
      }
    });

    setFormData(initialData);
    setShowForm(true);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingEntity(null);
    const config = entityConfigs[activeTab];
    const initialData = {};
    config.fields.forEach((field) => {
      initialData[field.name] = "";
    });
    setFormData(initialData);
    setShowForm(true);
  };

  // Get filtered entities
  const getFilteredEntities = () => {
    const entityList = entities[activeTab] || [];
    if (!searchTerm) return entityList;

    return entityList.filter((entity) => {
      const config = entityConfigs[activeTab];
      return config.displayFields.some((field) => {
        const value = field.includes(".")
          ? entity[field.split(".")[0]]?.[field.split(".")[1]]
          : entity[field];
        return value
          ?.toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      });
    });
  };

  // Get field value for display
  const getFieldValue = (entity, field) => {
    if (field.includes(".")) {
      const parts = field.split(".");
      return entity[parts[0]]?.[parts[1]] || "N/A";
    }

    return entity[field] || "N/A";
  };

  // Get select options
  const getSelectOptions = (optionsType) => {
    switch (optionsType) {
      case "brands":
        return entities.brands.map((b) => ({
          value: b.brand_id,
          label: b.brand_name,
        }));
      case "categories":
        return entities.categories.map((c) => ({
          value: c.product_category_id,
          label: c.category_name,
        }));
      case "subcategories":
        return entities.subcategories.map((s) => ({
          value: s.sub_category_id,
          label: s.sub_category_name,
        }));
      default:
        return [];
    }
  };

  const filteredEntities = getFilteredEntities();

  return (
    <RouteGuard allowedRoles={["admin"]} redirectTo="/login">
      <div className="flex flex-col min-h-screen text-white" style={{backgroundColor: '#000000'}}>
        <Navbar />

        <div className="flex-1 relative">
          {/* Enhanced KillSwitch-themed animated background */}
          <div className="fixed inset-0 z-[-1] overflow-hidden">
            {/* Grid lines */}
            <div className="absolute top-0 left-1/4 w-px h-full bg-white/5"></div>
            <div className="absolute top-0 left-2/4 w-px h-full bg-white/5"></div>
            <div className="absolute top-0 left-3/4 w-px h-full bg-white/5"></div>
            <div className="absolute top-1/3 left-0 w-full h-px bg-white/5"></div>
            <div className="absolute top-2/3 left-0 w-full h-px bg-white/5"></div>

            {/* KillSwitch-themed animated orbs */}
            <motion.div
              className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl"
              style={{ backgroundColor: 'rgba(199, 0, 7, 0.2)' }}
              animate={{
                x: [0, 30, 0],
                y: [0, -30, 0],
              }}
              transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl"
              style={{ backgroundColor: 'rgba(199, 0, 7, 0.15)' }}
              animate={{
                x: [0, -40, 0],
                y: [0, 40, 0],
              }}
              transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY }}
            />
            
            {/* Additional floating elements */}
            <motion.div
              className="absolute top-1/2 left-1/6 w-32 h-32 border border-[#c70007]/20 rotate-45 rounded-lg"
              animate={{ rotate: [45, 405] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute top-3/4 right-1/6 w-24 h-24 border border-[#c70007]/15 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <div className="pt-6 pb-12 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
              {/* Enhanced KillSwitch-themed Header */}
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <motion.button
                    onClick={() => router.push("/Admin")}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-white transition-all duration-300"
                    style={{
                      backgroundColor: '#1c1816',
                      border: '1px solid rgba(199, 0, 7, 0.3)'
                    }}
                    whileHover={{ 
                      scale: 1.05,
                      backgroundColor: 'rgba(199, 0, 7, 0.2)'
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Admin
                  </motion.button>
                </div>
                
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="p-3 rounded-xl flex items-center justify-center" style={{backgroundColor: '#c70007'}}>
                      <Database className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white">
                      Entity Management
                    </h1>
                  </div>
                  
                  <div className="h-1 w-24 mx-auto mb-6" style={{background: 'linear-gradient(to right, #c70007, #ff4444, #c70007)'}}></div>
                  
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                    Manage brands, categories, subcategories, and their relationships with advanced controls
                  </p>
                </motion.div>
              </div>

              {/* Enhanced KillSwitch-themed Tabs */}
              <motion.div 
                className="flex flex-wrap gap-2 mb-6 border-b border-gray-500/30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-t-xl transition-all duration-300 ${
                        isActive
                          ? "text-white"
                          : "text-gray-400 hover:text-white"
                      }`}
                      style={isActive 
                        ? { 
                            backgroundColor: '#c70007', 
                            borderBottom: '2px solid #c70007',
                            boxShadow: '0 4px 15px rgba(199, 0, 7, 0.3)'
                          }
                        : { 
                            backgroundColor: '#1c1816', 
                            borderBottom: '2px solid transparent'
                          }
                      }
                      whileHover={{ 
                        scale: isActive ? 1 : 1.05,
                        backgroundColor: isActive ? '#c70007' : 'rgba(199, 0, 7, 0.2)'
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{tab.label}</span>
                    </motion.button>
                  );
                })}
              </motion.div>

              {/* Enhanced KillSwitch-themed Controls */}
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{color: '#c70007'}} />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder-gray-400 transition-all duration-300 focus:ring-2 focus:ring-[#c70007]/20 focus:border-[#c70007]"
                    style={{
                      backgroundColor: '#000000',
                      border: '1px solid rgba(199, 0, 7, 0.3)'
                    }}
                  />
                </div>
                <div className="flex gap-3">
                  <motion.button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-white font-medium transition-all duration-300"
                    style={{
                      backgroundColor: '#c70007',
                      border: '1px solid #c70007',
                      boxShadow: '0 4px 15px rgba(199, 0, 7, 0.3)'
                    }}
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: '0 8px 25px rgba(199, 0, 7, 0.4)'
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="w-4 h-4" />
                    Add New
                  </motion.button>
                  <motion.button
                    onClick={() => fetchEntities(activeTab)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-white font-medium transition-all duration-300 disabled:opacity-50"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                    whileHover={{ 
                      scale: loading ? 1 : 1.05,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)'
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </motion.button>
                </div>
              </motion.div>

              {/* Enhanced KillSwitch-themed Entity List */}
              <motion.div 
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #1c1816 0%, #2a2520 100%)',
                  border: '1px solid rgba(199, 0, 7, 0.3)',
                  boxShadow: '0 20px 60px rgba(199, 0, 7, 0.1)'
                }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                {loading && !showForm ? (
                  <div className="flex justify-center items-center h-64">
                    <motion.div 
                      className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2"
                      style={{ borderColor: '#c70007' }}
                    />
                  </div>
                ) : filteredEntities.length === 0 ? (
                  <motion.div 
                    className="text-center py-12 text-gray-400"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    </motion.div>
                    <p className="text-lg font-medium">No {activeTab} found</p>
                    <p className="text-sm text-gray-500 mt-2">Try adjusting your search or add new entities</p>
                  </motion.div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead style={{backgroundColor: '#1c1816'}}>
                        <tr>
                          {entityConfigs[activeTab].displayFields.map(
                            (field) => (
                              <th
                                key={field}
                                className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider"
                              >
                                {field
                                  .replace(/[._]/g, " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                              </th>
                            )
                          )}
                          <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-500/30">
                        {filteredEntities.map((entity, index) => (
                          <motion.tr
                            key={
                              entity.id ||
                              entity[
                                entityConfigs[activeTab].displayFields[0]
                              ] ||
                              index
                            }
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-white/5 transition-colors"
                          >
                            {entityConfigs[activeTab].displayFields.map(
                              (field) => (
                                <td
                                  key={field}
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-300"
                                >
                                  {getFieldValue(entity, field)}
                                </td>
                              )
                            )}
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                <motion.button
                                  onClick={() => handleEdit(entity)}
                                  className="p-2 rounded-lg transition-all duration-300"
                                  style={{
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)'
                                  }}
                                  whileHover={{ 
                                    scale: 1.1,
                                    backgroundColor: 'rgba(59, 130, 246, 0.2)'
                                  }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Edit2 className="w-4 h-4 text-blue-400" />
                                </motion.button>
                                <motion.button
                                  onClick={() => handleDelete(entity)}
                                  className="p-2 rounded-lg transition-all duration-300"
                                  style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)'
                                  }}
                                  whileHover={{ 
                                    scale: 1.1,
                                    backgroundColor: 'rgba(239, 68, 68, 0.2)'
                                  }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Enhanced KillSwitch-themed Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
                className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, #1c1816 0%, #2a2520 100%)',
                  border: '1px solid rgba(199, 0, 7, 0.3)',
                  boxShadow: '0 20px 60px rgba(199, 0, 7, 0.2), 0 0 0 1px rgba(199, 0, 7, 0.1)'
                }}
              >
                {/* Animated header background */}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: 'linear-gradient(90deg, rgba(199, 0, 7, 0.05) 0%, transparent 50%, rgba(199, 0, 7, 0.05) 100%)'
                  }}
                  animate={{
                    background: [
                      'linear-gradient(90deg, rgba(199, 0, 7, 0.05) 0%, transparent 50%, rgba(199, 0, 7, 0.05) 100%)',
                      'linear-gradient(90deg, transparent 0%, rgba(199, 0, 7, 0.1) 50%, transparent 100%)',
                      'linear-gradient(90deg, rgba(199, 0, 7, 0.05) 0%, transparent 50%, rgba(199, 0, 7, 0.05) 100%)'
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />

                <div className="relative z-10 sticky top-0 p-6 border-b border-gray-500/30 flex justify-between items-center" style={{backgroundColor: '#1c1816'}}>
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="p-2 rounded-full flex items-center justify-center"
                      style={{backgroundColor: '#c70007'}}
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 2, -2, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                    >
                      {editingEntity ? <Edit2 className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                    </motion.div>
                    <h3 className="text-xl font-bold text-white">
                      {editingEntity ? "Edit" : "Add New"}{" "}
                      {activeTab.slice(0, -1)}
                    </h3>
                  </div>
                  <motion.button
                    onClick={() => {
                      setShowForm(false);
                      setEditingEntity(null);
                      setFormData({});
                    }}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                <form onSubmit={handleSubmit} className="relative z-10 p-6 space-y-6">
                  {entityConfigs[activeTab].fields.map((field) => (
                    <div key={field.name} className="space-y-3">
                      <label className="block text-sm font-bold text-white flex items-center gap-2">
                        {field.type === "select" && <Layers className="w-4 h-4" style={{color: '#c70007'}} />}
                        {field.type === "text" && <Edit2 className="w-4 h-4" style={{color: '#c70007'}} />}
                        {field.type === "number" && <Database className="w-4 h-4" style={{color: '#c70007'}} />}
                        {field.label}{" "}
                        {field.required && (
                          <span style={{color: '#c70007'}}>*</span>
                        )}
                      </label>
                      {field.type === "select" ? (
                        <select
                          value={formData[field.name] || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              [field.name]: e.target.value,
                            }))
                          }
                          required={field.required}
                          className="w-full rounded-xl px-4 py-3 text-white transition-all duration-300 focus:ring-2 focus:ring-[#c70007]/20 focus:border-[#c70007]"
                          style={{
                            backgroundColor: '#000000',
                            border: '1px solid rgba(199, 0, 7, 0.3)'
                          }}
                        >
                          <option value="" style={{backgroundColor: '#000000', color: '#ffffff'}}>Select {field.label}</option>
                          {getSelectOptions(field.options).map((option) => (
                            <option key={option.value} value={option.value} style={{backgroundColor: '#000000', color: '#ffffff'}}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={formData[field.name] || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              [field.name]: e.target.value,
                            }))
                          }
                          required={field.required}
                          className="w-full rounded-xl px-4 py-3 text-white transition-all duration-300 focus:ring-2 focus:ring-[#c70007]/20 focus:border-[#c70007]"
                          style={{
                            backgroundColor: '#000000',
                            border: '1px solid rgba(199, 0, 7, 0.3)'
                          }}
                        />
                      )}
                    </div>
                  ))}

                  <div className="flex gap-3 pt-6">
                    <motion.button
                      type="submit"
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-all duration-300 disabled:opacity-50"
                      style={{
                        backgroundColor: '#c70007',
                        border: '1px solid #c70007',
                        boxShadow: '0 4px 15px rgba(199, 0, 7, 0.3)'
                      }}
                      whileHover={{ 
                        scale: loading ? 1 : 1.05,
                        boxShadow: '0 8px 25px rgba(199, 0, 7, 0.4)'
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {editingEntity ? "Update" : "Create"}
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingEntity(null);
                        setFormData({});
                      }}
                      className="px-6 py-3 rounded-xl text-white font-medium transition-all duration-300"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                      whileHover={{ 
                        scale: 1.05,
                        backgroundColor: 'rgba(255, 255, 255, 0.2)'
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Cancel
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced KillSwitch-themed Success/Error Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-5 right-5 px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3"
              style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                boxShadow: '0 10px 30px rgba(34, 197, 94, 0.2)'
              }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-400" />
              </motion.div>
              <span className="text-green-300 font-medium">{success}</span>
              <motion.button
                onClick={() => setSuccess(null)}
                className="ml-2 text-green-300 hover:text-green-100 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-5 right-5 px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3"
              style={{
                background: 'linear-gradient(135deg, rgba(199, 0, 7, 0.2) 0%, rgba(199, 0, 7, 0.1) 100%)',
                border: '1px solid rgba(199, 0, 7, 0.3)',
                boxShadow: '0 10px 30px rgba(199, 0, 7, 0.2)'
              }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
              </motion.div>
              <span className="text-red-300 font-medium">{error}</span>
              <motion.button
                onClick={() => setError(null)}
                className="ml-2 text-red-300 hover:text-red-100 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <Footer />
      </div>
    </RouteGuard>
  );
};

export default EntityManagement;