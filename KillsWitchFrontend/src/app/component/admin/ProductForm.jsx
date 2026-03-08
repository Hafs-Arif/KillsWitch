"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { X, Edit, Plus, Save, Tag, DollarSign, Layers, Package, Star, Info, FileImage, Settings, Monitor, Fan, Zap, Keyboard, Mouse } from "lucide-react"

export default function ProductForm({
  editProductId,
  newProduct,
  setNewProduct,
  formLoading,
  onSubmit,
  onClose,
  brands,
  getCategoriesForBrand,
  getSubCategoriesForCategory,
}) {
  const [activeSpecTab, setActiveSpecTab] = useState('basic')
  const [showTemplates, setShowTemplates] = useState(false)

  // Product templates based on your specifications
  const productTemplates = {
    keyboard_v2: {
      name: "Keyboard V2",
      data: {
        product_model: "V2",
        axis: "None",
        number_of_keys: "104",
        weight: "0.95KG",
        carton_weight: "20KG",
        package_size: "50.2*21.5*4.9cm",
        carton_size_kb: "52*51.5*45cm/20 pcs",
        keycap_technology: "double-color injection molding",
        wire_length: "1.45m",
        lighting_style: "mixed light effects",
        body_material: "brushed aluminum alloy panel"
      }
    },
    mouse_g5: {
      name: "Mouse G5",
      data: {
        product_model: "G5",
        dpi: "1200-1600-2400-3200",
        number_of_keys: "6",
        weight: "0.13KG",
        carton_weight: "14kg",
        package_size: "8.3*13.3*4.5cm",
        carton_size_kb: "47.5*43.5*28.5 cm/100 pcs",
        return_rate: "500",
        engine_solution: "A603EP",
        wire_length: "1.42m",
        lighting_style: "Seven-color cycle breathing",
        surface_technology: "frosted"
      }
    },
    fan_4pro: {
      name: "Fan 4PRO",
      data: {
        product_model: "4PRO",
        light_effect: "5VARGB",
        fan_interface: "PWM 4pin +SYNC 3pin",
        fan_speed: "600-1600±10% RPM",
        fan_airflow: "55±10% CFM",
        fan_wind_pressure: "1.86mmH2O±10%",
        fan_noise: "11-26±10% DBA",
        fan_bearing_type: "Hydraulic",
        fan_power: "3.4W",
        fan_rated_voltage: "LED 5V, Fan 12V"
      }
    },
    fan_sjg: {
      name: "Fan SJG",
      data: {
        product_model: "SJG",
        light_effect: "5VARGB",
        fan_interface: "PWM 4pin +SYNC 3pin",
        fan_speed: "600-1600±10% RPM",
        fan_airflow: "55±10% CFM",
        fan_wind_pressure: "1.86mmH2O±10%",
        fan_noise: "11-26±10% DBA",
        fan_bearing_type: "Hydraulic",
        fan_power: "3.4W",
        fan_rated_voltage: "LED 5V, Fan 12V"
      }
    },
    cooler_dp240: {
      name: "Water Cooler DP-B240/W240",
      data: {
        product_model: "DP-B240-01 / DP-W240-01",
        pump_parameter: "with video display",
        pump_bearing: "Ceramic Bearing",
        fan_size: "120*120*25mm*2",
        drainage_size: "274*120*27mm",
        fan_speed: "800-1800RPM±10%",
        fan_rated_voltage: "DC 12V",
        fan_interface: "3pin 5V+small 4PIN PMW",
        fan_power: "3.4W",
        fan_airflow: "29.22-67.3CFM±10%",
        pump_speed: "2600±10% RPM",
        fan_wind_pressure: "0.55-2.02mmh2O±10%",
        light_effect: "ARGB",
        fan_noise: "22.3-35.1dBA±10%",
        pipe_length_material: "400mm / EPDM+IIR",
        carton_size: "606*360*421 mm",
        pump_noise: "26±10% dBA",
        packing: "9PCS/CTN",
        pump_interface: "2510-3pin auto rgb / USB 2.0",
        tdp: "245-250W",
        moq_customization: "300pcs",
        customization_options: "color box, Drainage LOGO, Fans, Pipe length, Fans' Logo"
      }
    },
    case_ks_mxj: {
      name: "Case KS-MXJ PLUS",
      data: {
        product_model: "KS-MXJ PLUS (Black/White)",
        motherboard: "ATX/m-ATX/ITX",
        material: "SPCC+Tempered Glass",
        front_ports: "USB 3.0*1, USB 2.0*2",
        hdd_support: "2x 3.5\"",
        gpu_length: "400mm",
        ssd_support: "3x 2.5\"",
        cpu_height: "157mm",
        expansion_slots: "7",
        case_size: "418*280*435mm",
        water_cooling_support: "240mm/360mm",
        carton_size: "492*343*495mm",
        case_fan_support: "12cm*10",
        loading_capacity: "800pcs (40HQ)"
      }
    },
    case_lc110g: {
      name: "Case LC-110G",
      data: {
        product_model: "LC-110G (Black) / LC-100G (White)",
        motherboard: "ATX/m-ATX",
        material: "SPCC+Tempered Glass",
        front_ports: "USB2.0*1 USB3.0*1",
        hdd_support: "compatible HDD*1",
        gpu_length: "310MM",
        ssd_support: "3x 2.5\"",
        cpu_height: "165MM",
        expansion_slots: "4",
        case_size: "625*302*557MM",
        water_cooling_support: "120mm/240mm",
        carton_size: "710*645*355MM",
        case_fan_support: "12cm*7",
        loading_capacity: "415pcs (40HQ)"
      }
    }
  }

  // Get relevant templates based on selected category
  const getRelevantTemplates = () => {
    const categoryLower = newProduct.category_name?.toLowerCase() || ""
    const relevantTemplates = {}
    
    if (categoryLower.includes('keyboard')) {
      relevantTemplates.keyboard_v2 = productTemplates.keyboard_v2
    }
    
    if (categoryLower.includes('mouse')) {
      relevantTemplates.mouse_g5 = productTemplates.mouse_g5
    }
    
    if (categoryLower.includes('fan')) {
      relevantTemplates.fan_4pro = productTemplates.fan_4pro
      relevantTemplates.fan_sjg = productTemplates.fan_sjg
    }
    
    if (categoryLower.includes('cooler') || categoryLower.includes('cooling') || categoryLower.includes('water')) {
      relevantTemplates.cooler_dp240 = productTemplates.cooler_dp240
    }
    
    if (categoryLower.includes('case') || categoryLower.includes('server')) {
      relevantTemplates.case_ks_mxj = productTemplates.case_ks_mxj
      relevantTemplates.case_lc110g = productTemplates.case_lc110g
    }
    
    return relevantTemplates
  }

  const applyTemplate = (templateKey) => {
    const template = productTemplates[templateKey]
    if (template) {
      setNewProduct({
        ...newProduct,
        ...template.data
      })
      setShowTemplates(false)
      // Auto-switch to appropriate tab
      if (templateKey.includes('keyboard')) {
        setActiveSpecTab('keyboard')
      } else if (templateKey.includes('mouse')) {
        setActiveSpecTab('mouse')
      } else if (templateKey.includes('fan')) {
        setActiveSpecTab('fan')
      } else if (templateKey.includes('cooler')) {
        setActiveSpecTab('cooling')
      } else if (templateKey.includes('case')) {
        setActiveSpecTab('case')
      }
    }
  }
  
  const handleNewProductChange = (e) => {
    const { name, value } = e.target
    setNewProduct({ ...newProduct, [name]: value })
  }

  const handleBrandChange = (e) => {
    const brandName = e.target.value
    setNewProduct({
      ...newProduct,
      brand_name: brandName,
      category_name: "",
      sub_category_name: "",
    })
  }

  const handleCategoryChange = (e) => {
    const categoryName = e.target.value
    setNewProduct({
      ...newProduct,
      category_name: categoryName,
      sub_category_name: "",
    })
    // Auto-switch to appropriate spec tab based on category
    const categoryLower = categoryName.toLowerCase()
    if (categoryLower.includes('case') || categoryLower.includes('server')) {
      setActiveSpecTab('case')
    } else if (categoryLower.includes('cooler') || categoryLower.includes('cooling')) {
      setActiveSpecTab('cooling')
    } else if (categoryLower.includes('fan')) {
      setActiveSpecTab('fan')
    } else if (categoryLower.includes('keyboard')) {
      setActiveSpecTab('keyboard')
    } else if (categoryLower.includes('mouse')) {
      setActiveSpecTab('mouse')
    }
  }

  // Get category-specific specification tabs
  const getSpecTabs = () => {
    const categoryLower = newProduct.category_name?.toLowerCase() || ""
    const tabs = [{ id: 'basic', label: 'Basic Info', icon: Info }]
    
    if (categoryLower.includes('case') || categoryLower.includes('server')) {
      tabs.push({ id: 'case', label: 'Case Specs', icon: Monitor })
    }
    if (categoryLower.includes('cooler') || categoryLower.includes('cooling') || categoryLower.includes('pump')) {
      tabs.push({ id: 'cooling', label: 'Cooling Specs', icon: Zap })
    }
    if (categoryLower.includes('fan')) {
      tabs.push({ id: 'fan', label: 'Fan Specs', icon: Fan })
    }
    if (categoryLower.includes('keyboard')) {
      tabs.push({ id: 'keyboard', label: 'Keyboard Specs', icon: Keyboard })
    }
    if (categoryLower.includes('mouse')) {
      tabs.push({ id: 'mouse', label: 'Mouse Specs', icon: Mouse })
    }
    
    tabs.push({ id: 'packaging', label: 'Packaging', icon: Package })
    tabs.push({ id: 'images', label: 'Media (Images & Video)', icon: FileImage })
    return tabs
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-auto border border-gray-500/30 rounded-2xl shadow-2xl" style={{backgroundColor: '#1c1816'}}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 p-2 rounded-full hover:opacity-80 text-white transition-colors z-10" style={{backgroundColor: '#1c1816'}}
          onClick={onClose}
          disabled={formLoading}
        >
          <X className="w-5 h-5" /> 
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            {editProductId ? (
              <>
                <Edit className="w-6 h-6 mr-2" style={{color: '#c70007'}} />
                Edit Product
              </>
            ) : (
              <>
                <Plus className="w-6 h-6 mr-2" style={{color: '#c70007'}} />
                Add New Product
              </>
            )}
          </h2>

          {formLoading && (
            <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center z-20 backdrop-blur-sm">
              <div className="flex flex-col items-center p-8 rounded-xl border border-gray-500/30" style={{backgroundColor: '#1c1816'}}>
                {/* Enhanced Loading Animation */}
                <div className="relative mb-6">
                  <div className="animate-spin rounded-full h-16 w-16 border-4" style={{borderColor: '#c70007', opacity: '0.3'}}></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 absolute top-0 left-0" style={{borderTopColor: '#c70007'}}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full animate-pulse" style={{backgroundColor: '#c70007'}}></div>
                  </div>
                </div>
                
                {/* Progress Text */}
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {editProductId ? "🔄 Updating Product" : "✨ Adding New Product"}
                  </h3>
                  <p className="text-gray-300 mb-4">
                    {editProductId 
                      ? "Saving your changes and updating images..." 
                      : "Processing images and creating product record..."
                    }
                  </p>
                  
                  {/* Progress Steps */}
                  <div className="flex items-center justify-center space-x-4 text-sm">
                    <div className="flex items-center text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      Validating data
                    </div>
                    <div className="flex items-center text-yellow-400">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
                      Processing images
                    </div>
                    <div className="flex items-center text-blue-400">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                      Saving to database
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-400 mt-4">
                    ⚡ This may take a few moments for large images...
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Part Number */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center">
                  <Tag className="w-4 h-4 mr-1" style={{color: '#c70007'}} />
                  Part Number*
                </label>
                <input
                  type="text"
                  name="part_number"
                  value={newProduct.part_number}
                  onChange={handleNewProductChange}
                  placeholder="Enter part number"
                  className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                  required
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" style={{color: '#c70007'}} />
                  Price*
                </label>
                <input
                  type="number"
                  name="price"
                  value={newProduct.price}
                  onChange={handleNewProductChange}
                  placeholder="Enter price"
                  className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                  required
                  step="0.01"
                />
              </div>

              {/* Sale Price */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" style={{color: '#ff6b6b'}} />
                  Sale Price (Optional)
                </label>
                <input
                  type="number"
                  name="sale_price"
                  value={newProduct.sale_price || ''}
                  onChange={handleNewProductChange}
                  placeholder="Enter sale price (leave empty if no sale)"
                  className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                  step="0.01"
                />
                {newProduct.sale_price && newProduct.price && parseFloat(newProduct.sale_price) < parseFloat(newProduct.price) && (
                  <p className="text-xs text-green-400">✅ Sale: {((1 - newProduct.sale_price/newProduct.price) * 100).toFixed(1)}% off</p>
                )}
              </div>

              {/* Brand */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center">
                  <Tag className="w-4 h-4 mr-1" style={{color: '#c70007'}} />
                  Brand*
                </label>
                <select
                  name="brand_name"
                  value={newProduct.brand_name}
                  onChange={handleBrandChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                  required
                >
                  <option value="">Select a brand</option>
                  {brands.map((brand) => (
                    <option key={brand.brand_id} value={brand.brand_name}>
                      {brand.brand_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center">
                  <Layers className="w-4 h-4 mr-1" style={{color: '#c70007'}} />
                  Category*
                </label>
                <select
                  name="category_name"
                  value={newProduct.category_name}
                  onChange={handleCategoryChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                  required
                  disabled={!newProduct.brand_name}
                >
                  <option value="">Select a category</option>
                  {getCategoriesForBrand(newProduct.brand_name).map((category, index) => (
                    <option key={index} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sub Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center">
                  <Layers className="w-4 h-4 mr-1" style={{color: '#c70007'}} />
                  Sub Category
                </label>
                <select
                  name="sub_category_name"
                  value={newProduct.sub_category_name}
                  onChange={handleNewProductChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                  disabled={!newProduct.category_name}
                >
                  <option value="">Select a sub category</option>
                  {newProduct.brand_name &&
                    newProduct.category_name &&
                    getSubCategoriesForCategory(newProduct.brand_name, newProduct.category_name).map(
                      (subCat, index) => (
                        <option key={index} value={subCat}>
                          {subCat}
                        </option>
                      ),
                    )}
                </select>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center">
                  <Package className="w-4 h-4 mr-1" style={{color: '#c70007'}} />
                  Quantity*
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={newProduct.quantity}
                  onChange={handleNewProductChange}
                  placeholder="Enter quantity"
                  className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                  required
                  min="0"
                />
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center">
                  <Package className="w-4 h-4 mr-1" style={{color: '#c70007'}} />
                  Condition*
                </label>
                <select
                  name="condition"
                  value={newProduct.condition}
                  onChange={handleNewProductChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                  required
                >
                  <option value="">Select condition</option>
                  <option value="NEW">NEW</option>
                  <option value="USED">USED</option>
                  <option value="REFURBISHED">REFURBISHED</option>
                </select>
              </div>

              {/* Sub Condition */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center">
                  <Star className="w-4 h-4 mr-1" style={{color: '#c70007'}} />
                  Sub Condition
                </label>
                <select
                  name="sub_condition"
                  value={newProduct.sub_condition}
                  onChange={handleNewProductChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                >
                  <option value="">Select sub condition</option>
                  <option value="New Sealed">New Sealed</option>
                  <option value="Grade A">Grade A</option>
                  <option value="Grade B">Grade B</option>
                  <option value="Grade C">Grade C</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center">
                  <Info className="w-4 h-4 mr-1" style={{color: '#c70007'}} />
                  Status*
                </label>
                <select
                  name="status"
                  value={newProduct.status}
                  onChange={handleNewProductChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                  required
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            {/* Short Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center">
                <Info className="w-4 h-4 mr-1" style={{color: '#c70007'}} />
                Short Description*
              </label>
              <textarea
                name="short_description"
                value={newProduct.short_description}
                onChange={handleNewProductChange}
                placeholder="Enter short description"
                className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                required
                rows="2"
              ></textarea>
            </div>

            {/* Long Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center">
                <Info className="w-4 h-4 mr-1" style={{color: '#c70007'}} />
                Long Description
              </label>
              <textarea
                name="long_description"
                value={newProduct.long_description}
                onChange={handleNewProductChange}
                placeholder="Enter long description"
                className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                rows="4"
              ></textarea>
            </div>

            {/* SEO Slug */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center">
                <Tag className="w-4 h-4 mr-1" style={{color: '#c70007'}} />
                URL Slug (Auto-generated)
              </label>
              <input
                type="text"
                name="slug"
                value={newProduct.slug || ''}
                onChange={handleNewProductChange}
                placeholder="Enter URL slug (leave empty to auto-generate)"
                className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
              />
              <p className="text-xs text-gray-400">💡 You can edit the slug for SEO; leave empty to auto-generate</p>
            </div>

            {/* Specification Tabs */}
            {newProduct.category_name && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Settings className="w-5 h-5 mr-2" style={{color: '#c70007'}} />
                    Product Specifications
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowTemplates(true)}
                    className="px-3 py-1 text-white text-sm rounded-lg transition-colors hover:opacity-80 flex items-center gap-2" style={{backgroundColor: '#c70007'}}
                  >
                    <Settings className="w-4 h-4" />
                    Use Template
                  </button>
                </div>
                
                
                {/* Tab Navigation */}
                <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-2">
                  {getSpecTabs().map((tab) => {
                    const IconComponent = tab.icon
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveSpecTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          activeSpecTab === tab.id
                            ? 'text-white'
                            : 'text-gray-300 hover:opacity-80'
                        }`}
                        style={activeSpecTab === tab.id ? {backgroundColor: '#c70007'} : {backgroundColor: '#1c1816'}}
                      >
                        <IconComponent className="w-4 h-4" />
                        {tab.label}
                      </button>
                    )
                  })}
                </div>

                {/* Tab Content */}
                <div className="min-h-[200px]">
                  {activeSpecTab === 'basic' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Product Model */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Product Model</label>
                        <input
                          type="text"
                          name="product_model"
                          value={newProduct.product_model || ''}
                          onChange={handleNewProductChange}
                          placeholder="Enter product model"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                    </div>
                  )}

                  {activeSpecTab === 'case' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Case Specifications */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Motherboard Support</label>
                        <input
                          type="text"
                          name="motherboard"
                          value={newProduct.motherboard || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., ATX, Micro-ATX, Mini-ITX"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Material</label>
                        <input
                          type="text"
                          name="material"
                          value={newProduct.material || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., Steel, Aluminum, Tempered Glass"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Case Size</label>
                        <input
                          type="text"
                          name="case_size"
                          value={newProduct.case_size || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., Full Tower, Mid Tower, Mini ITX"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Front Ports</label>
                        <input
                          type="text"
                          name="front_ports"
                          value={newProduct.front_ports || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., 2x USB 3.0, 1x USB-C, Audio"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Max GPU Length</label>
                        <input
                          type="text"
                          name="gpu_length"
                          value={newProduct.gpu_length || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., 350mm"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Max CPU Height</label>
                        <input
                          type="text"
                          name="cpu_height"
                          value={newProduct.cpu_height || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., 165mm"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">HDD Support</label>
                        <input
                          type="text"
                          name="hdd_support"
                          value={newProduct.hdd_support || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., 2x 3.5 inch HDD"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">SSD Support</label>
                        <input
                          type="text"
                          name="ssd_support"
                          value={newProduct.ssd_support || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., 4x 2.5 inch SSD"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Water Cooling Support</label>
                        <input
                          type="text"
                          name="water_cooling_support"
                          value={newProduct.water_cooling_support || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., 240mm, 280mm, 360mm"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                    </div>
                  )}

                  {activeSpecTab === 'cooling' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Cooling/Pump Specifications */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Pump Parameters</label>
                        <textarea
                          name="pump_parameter"
                          value={newProduct.pump_parameter || ''}
                          onChange={handleNewProductChange}
                          placeholder="Enter pump parameters"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                          rows="2"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Pump Speed</label>
                        <input
                          type="text"
                          name="pump_speed"
                          value={newProduct.pump_speed || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., 2600 RPM"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">TDP</label>
                        <input
                          type="text"
                          name="tdp"
                          value={newProduct.tdp || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., 250W"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Light Effect</label>
                        <input
                          type="text"
                          name="light_effect"
                          value={newProduct.light_effect || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., RGB, ARGB, None"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Pump Bearing</label>
                        <input
                          type="text"
                          name="pump_bearing"
                          value={newProduct.pump_bearing || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., Ceramic Bearing"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Pump Interface</label>
                        <input
                          type="text"
                          name="pump_interface"
                          value={newProduct.pump_interface || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., 4-pin PWM"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                    </div>
                  )}

                  {activeSpecTab === 'fan' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Fan Specifications */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Fan Size</label>
                        <input
                          type="text"
                          name="fan_size"
                          value={newProduct.fan_size || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., 120mm, 140mm"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Fan Speed</label>
                        <input
                          type="text"
                          name="fan_speed"
                          value={newProduct.fan_speed || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., 1200 RPM"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Airflow</label>
                        <input
                          type="text"
                          name="fan_airflow"
                          value={newProduct.fan_airflow || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., 50 CFM"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Fan Noise</label>
                        <input
                          type="text"
                          name="fan_noise"
                          value={newProduct.fan_noise || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., 25 dBA"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Fan Voltage</label>
                        <input
                          type="text"
                          name="fan_voltage"
                          value={newProduct.fan_voltage || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., 12V DC"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Fan Power</label>
                        <input
                          type="text"
                          name="fan_power"
                          value={newProduct.fan_power || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., 2.4W"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                    </div>
                  )}

                  {activeSpecTab === 'keyboard' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Keyboard Specifications */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Switch Type</label>
                        <input
                          type="text"
                          name="axis"
                          value={newProduct.axis || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., Cherry MX Blue, Red, Brown"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Number of Keys</label>
                        <input
                          type="text"
                          name="number_of_keys"
                          value={newProduct.number_of_keys || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., 104, 87, 60"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Lighting Style</label>
                        <input
                          type="text"
                          name="lighting_style"
                          value={newProduct.lighting_style || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., RGB, Single Color, None"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Keycap Technology</label>
                        <input
                          type="text"
                          name="keycap_technology"
                          value={newProduct.keycap_technology || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., Double-shot, Laser Etched"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Weight</label>
                        <input
                          type="text"
                          name="weight"
                          value={newProduct.weight || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., 1.2kg"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Wire Length</label>
                        <input
                          type="text"
                          name="wire_length"
                          value={newProduct.wire_length || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., 1.8m"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                    </div>
                  )}

                  {activeSpecTab === 'mouse' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Mouse Specifications */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">DPI</label>
                        <input
                          type="text"
                          name="dpi"
                          value={newProduct.dpi || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., 16000 DPI"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Return Rate</label>
                        <input
                          type="text"
                          name="return_rate"
                          value={newProduct.return_rate || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., 1000Hz"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Engine Solution</label>
                        <input
                          type="text"
                          name="engine_solution"
                          value={newProduct.engine_solution || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., Optical, Laser"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Surface Technology</label>
                        <input
                          type="text"
                          name="surface_technology"
                          value={newProduct.surface_technology || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., Any surface, Cloth pad optimized"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                    </div>
                  )}

                  {activeSpecTab === 'packaging' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Packaging & Customization */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Package Type</label>
                        <input
                          type="text"
                          name="package"
                          value={newProduct.package || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., Retail Box, OEM"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Packing</label>
                        <input
                          type="text"
                          name="packing"
                          value={newProduct.packing || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., Color Box, Brown Box"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">MOQ Customization</label>
                        <input
                          type="text"
                          name="moq_customization"
                          value={newProduct.moq_customization || ''}
                          onChange={handleNewProductChange}
                          placeholder="e.g., 500 pcs"
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-gray-300">Customization Options</label>
                        <textarea
                          name="customization_options"
                          value={newProduct.customization_options || ''}
                          onChange={handleNewProductChange}
                          placeholder="Describe available customization options..."
                          className="w-full px-4 py-2 rounded-lg border border-gray-500/30 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-[#c70007]" style={{backgroundColor: '#1c1816'}}
                          rows="3"
                        />
                      </div>
                    </div>
                  )}

                  {activeSpecTab === 'images' && (
                    <div className="space-y-4">
                      {/* Single Image Upload for All Images */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-300 flex items-center">
                          <FileImage className="w-4 h-4 mr-2" style={{color: '#c70007'}} />
                          Product Media{!editProductId && "*"}
                          <span className="ml-2 px-2 py-1 text-xs rounded" style={{backgroundColor: '#1c1816', color: '#c70007'}}>
                            Upload 1-10 images (video below)
                          </span>
                        </label>
                        
                        <div className="space-y-4">
                          {/* Main Image Upload */}
                          <div className="rounded-lg p-4 border-2 border-dashed border-gray-500/30 hover:border-[#c70007] transition-colors" style={{backgroundColor: '#1c1816'}}>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Main Product Image {(!newProduct.imageFile && !newProduct.image) && <span className="text-red-500">*</span>}
                            </label>
                            
                            {newProduct.imageFile ? (
                              <div className="relative group">
                                <div className="w-full h-48 rounded-lg overflow-hidden border-2" style={{borderColor: '#c70007'}}>
                                  <img
                                    src={typeof newProduct.imageFile === 'string' 
                                      ? newProduct.imageFile 
                                      : URL.createObjectURL(newProduct.imageFile)}
                                    alt="Main product preview"
                                    className="w-full h-full object-contain bg-black"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setNewProduct({
                                    ...newProduct,
                                    imageFile: null,
                                    originalFileName: ''
                                  })}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                  title="Remove main image"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : newProduct.image ? (
                              <div className="relative group">
                                <div className="w-full h-48 rounded-lg overflow-hidden border-2 border-yellow-500">
                                  <img
                                    src={newProduct.image}
                                    alt="Current main image"
                                    className="w-full h-full object-contain bg-black"
                                  />
                                </div>
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = 'image/*';
                                      input.onchange = (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          setNewProduct({
                                            ...newProduct,
                                            imageFile: file,
                                            originalFileName: file.name
                                          });
                                        }
                                      };
                                      input.click();
                                    }}
                                    className="px-3 py-1 text-white text-sm rounded-md flex items-center gap-1 hover:opacity-80 transition-colors" style={{backgroundColor: '#c70007'}}
                                  >
                                    <Edit className="w-4 h-4" /> Replace
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <FileImage className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="mt-2 flex text-sm text-gray-400 justify-center">
                                  <label
                                    htmlFor="main-image-upload"
                                    className="relative cursor-pointer rounded-md font-medium focus-within:outline-none hover:opacity-80 transition-colors" style={{backgroundColor: '#1c1816', color: '#c70007'}}
                                  >
                                    <span>Upload main image</span>
                                    <input
                                      id="main-image-upload"
                                      name="main-image-upload"
                                      type="file"
                                      className="sr-only"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          setNewProduct({
                                            ...newProduct,
                                            imageFile: file,
                                            originalFileName: file.name
                                          });
                                        }
                                      }}
                                      required={!editProductId}
                                    />
                                  </label>
                                  <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  PNG, JPG, WebP up to 5MB
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Additional Images */}
                          <div className="rounded-lg p-4 border-2 border-dashed border-gray-500/30 hover:border-[#c70007] transition-colors" style={{backgroundColor: '#1c1816'}}>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Additional Images (Optional)
                            </label>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                              {/* Existing additional images */}
                              {newProduct.additional_images?.map((img, index) => (
                                <div key={`existing-${index}`} className="relative group">
                                  <div className="w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-500/30 hover:border-[#c70007] transition-colors">
                                    <img
                                      src={img}
                                      alt={`Additional ${index + 1}`}
                                      className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const input = document.createElement('input');
                                          input.type = 'file';
                                          input.accept = 'image/*';
                                          input.onchange = (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              const updated = [...(newProduct.additional_images || [])];
                                              updated[index] = URL.createObjectURL(file);
                                              setNewProduct({
                                                ...newProduct,
                                                additional_images: updated,
                                                replaced_images: {
                                                  ...(newProduct.replaced_images || {}),
                                                  [img]: file // Store the new file to be uploaded
                                                }
                                              });
                                            }
                                          };
                                          input.click();
                                        }}
                                        className="px-3 py-1 text-white text-xs rounded-md flex items-center gap-1 hover:opacity-80 transition-colors" style={{backgroundColor: '#c70007'}}
                                      >
                                        <Edit className="w-3 h-3" /> Replace
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const updated = [...(newProduct.additional_images || [])];
                                          updated.splice(index, 1);
                                          setNewProduct({
                                            ...newProduct,
                                            additional_images: updated,
                                            deleted_additional_images: [
                                              ...(newProduct.deleted_additional_images || []),
                                              img
                                            ]
                                          });
                                        }}
                                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-md flex items-center gap-1"
                                      >
                                        <X className="w-3 h-3" /> Remove
                                      </button>
                                    </div>
                                  </div>
                                  <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                                    Existing
                                  </div>
                                </div>
                              ))}
                              
                              {/* New additional images */}
                              {newProduct.additional_image_files?.map((file, index) => (
                                <div key={`new-${index}`} className="relative group">
                                  <div className="w-full aspect-square rounded-lg overflow-hidden border border-gray-500/30">
                                    <img
                                      src={URL.createObjectURL(file)}
                                      alt={`New additional ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...(newProduct.additional_image_files || [])];
                                      updated.splice(index, 1);
                                      setNewProduct({
                                        ...newProduct,
                                        additional_image_files: updated
                                      });
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Remove image"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              
                              {/* Add more button */}
                              {(newProduct.additional_images?.length || 0) + (newProduct.additional_image_files?.length || 0) < 9 && (
                                <div className="flex items-center justify-center border-2 border-dashed border-gray-500/30 rounded-lg hover:border-[#c70007] transition-colors">
                                  <label className="flex flex-col items-center p-4 cursor-pointer w-full h-full">
                                    <Plus className="h-8 w-8 text-gray-400" />
                                    <span className="text-xs text-gray-400 mt-1">
                                      Add more
                                    </span>
                                    <input
                                      type="file"
                                      multiple
                                      className="hidden"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        if (files.length === 0) return;
                                        
                                        const currentCount = (newProduct.additional_images?.length || 0) + 
                                                          (newProduct.additional_image_files?.length || 0);
                                        
                                        if (currentCount + files.length > 9) {
                                          alert(`You can only upload up to 9 additional images. You already have ${currentCount}.`);
                                          return;
                                        }
                                        
                                        setNewProduct({
                                          ...newProduct,
                                          additional_image_files: [
                                            ...(newProduct.additional_image_files || []),
                                            ...files
                                          ]
                                        });
                                      }}
                                    />
                                  </label>
                                </div>
                              )}
                            </div>
                            
                            <p className="text-xs text-gray-400 mt-2">
                              You can add up to {9 - ((newProduct.additional_images?.length || 0) + (newProduct.additional_image_files?.length || 0))} more images
                            </p>
                          </div>
                        </div>

                        {/* Image Preview Section */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-300 flex items-center">
                            Image Preview
                            <span className="ml-2 text-xs text-gray-400">
                              ({(newProduct.imageFile || newProduct.image ? 1 : 0) + 
                                (newProduct.additional_image_files?.length || 0) + 
                                (newProduct.additional_images?.length || 0)}/10 total)
                            </span>
                          </h4>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {/* Main Image Preview */}
                            {newProduct.imageFile ? (
                              <div className="relative group">
                                <div className="w-full aspect-square rounded-lg overflow-hidden border-2 shadow-lg" style={{borderColor: '#c70007'}}>
                                  <img
                                    src={URL.createObjectURL(newProduct.imageFile)}
                                    alt="New main product image"
                                    className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                                  />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => setNewProduct({
                                        ...newProduct,
                                        imageFile: null,
                                        originalFileName: ''
                                      })}
                                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded flex items-center gap-1"
                                    >
                                      <X className="w-3 h-3" /> Remove
                                    </button>
                                  </div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 text-white text-xs px-1 py-0.5 text-center" style={{backgroundColor: '#c70007'}}>
                                  New Main
                                </div>
                              </div>
                            ) : newProduct.image && (
                              <div className="relative group">
                                <div className="w-full aspect-square rounded-lg overflow-hidden border-2 shadow-lg" style={{borderColor: '#c70007'}}>
                                  <img
                                    src={newProduct.image}
                                    alt="Current main image"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 text-white text-xs px-1 py-0.5 text-center" style={{backgroundColor: '#1c1816'}}>
                                  Current Main
                                </div>
                              </div>
                            )}
                            {newProduct.additional_images && newProduct.additional_images.map((img, index) => (
                              <div key={`existing-add-${index}`} className="relative group">
                                <div className="w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-500/30 shadow-lg">
                                  <img
                                    src={img}
                                    alt={`Additional ${index + 1}`}
                                    className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                                  />
                                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'image/*';
                                        input.onchange = (e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const updated = [...(newProduct.additional_images || [])];
                                            updated[index] = URL.createObjectURL(file);
                                            setNewProduct({
                                              ...newProduct,
                                              additional_images: updated,
                                              replaced_images: {
                                                ...(newProduct.replaced_images || {}),
                                                [img]: file
                                              }
                                            });
                                          }
                                        };
                                        input.click();
                                      }}
                                      className="w-full px-2 py-1 text-white text-xs rounded flex items-center justify-center gap-1 hover:opacity-80 transition-colors" style={{backgroundColor: '#c70007'}}
                                    >
                                      <Edit className="w-3 h-3" /> Replace
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...(newProduct.additional_images || [])];
                                        updated.splice(index, 1);
                                        setNewProduct({
                                          ...newProduct,
                                          additional_images: updated,
                                          deleted_additional_images: [
                                            ...(newProduct.deleted_additional_images || []),
                                            img
                                          ]
                                        });
                                      }}
                                      className="w-full px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded flex items-center justify-center gap-1"
                                    >
                                      <X className="w-3 h-3" /> Remove
                                    </button>
                                  </div>
                                </div>
                                <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                                  Existing
                                </div>
                              </div>
                            ))}
                            
                            {/* New Additional Images */}
                            {newProduct.additional_image_files?.map((file, index) => (
                              <div key={`new-${index}`} className="relative group">
                                <div className="w-full aspect-square rounded-lg overflow-hidden border-2 shadow-lg" style={{borderColor: '#c70007'}}>
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={`New additional ${index + 1}`}
                                    className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                                  />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...(newProduct.additional_image_files || [])];
                                        updated.splice(index, 1);
                                        setNewProduct({
                                          ...newProduct,
                                          additional_image_files: updated
                                        });
                                      }}
                                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded flex items-center gap-1"
                                    >
                                      <X className="w-3 h-3" /> Remove
                                    </button>
                                  </div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 text-white text-xs px-1 py-0.5 text-center" style={{backgroundColor: '#c70007'}}>
                                  New {index + 1}
                                </div>
                              </div>
                            ))}
                            
                            {/* Add More Button */}
                            {((newProduct.imageFile || newProduct.image ? 1 : 0) + 
                              (newProduct.additional_image_files?.length || 0) + 
                              (newProduct.additional_images?.length || 0)) < 10 && (
                              <div className="flex items-center justify-center border-2 border-dashed border-gray-500/30 rounded-lg hover:border-[#c70007] transition-colors">
                                <label className="flex flex-col items-center p-4 cursor-pointer w-full h-full">
                                  <Plus className="h-8 w-8 text-gray-400" />
                                  <span className="text-xs text-gray-400 mt-1">
                                    Add more
                                  </span>
                                  <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const files = Array.from(e.target.files || []);
                                      if (files.length === 0) return;
                                      
                                      const currentCount = ((newProduct.imageFile || newProduct.image ? 1 : 0) + 
                                                        (newProduct.additional_image_files?.length || 0) + 
                                                        (newProduct.additional_images?.length || 0));
                                      
                                      if (currentCount + files.length > 10) {
                                        alert(`You can only upload up to 10 images total. You already have ${currentCount} images.`);
                                        return;
                                      }
                                      
                                      setNewProduct({
                                        ...newProduct,
                                        additional_image_files: [
                                          ...(newProduct.additional_image_files || []),
                                          ...files
                                        ]
                                      });
                                    }}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-xs text-gray-400 mt-1">
                            Total images: {((newProduct.imageFile || newProduct.image ? 1 : 0) + 
                                         (newProduct.additional_image_files?.length || 0) + 
                                         (newProduct.additional_images?.length || 0))}/10
                            {((newProduct.imageFile || newProduct.image ? 1 : 0) + 
                             (newProduct.additional_image_files?.length || 0) + 
                             (newProduct.additional_images?.length || 0)) === 10 && (
                              <span className="text-yellow-400 ml-2">Maximum images reached</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Video Upload Section */}
                      <div className="space-y-4 mt-6 pt-6 border-t border-gray-700">
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-gray-300 flex items-center">
                            <FileImage className="w-4 h-4 mr-2" style={{color: '#c70007'}} />
                            Product Video (Optional)
                            <span className="ml-2 px-2 py-1 text-xs rounded" style={{backgroundColor: '#1c1816', color: '#c70007'}}>
                              Max 1 video
                            </span>
                          </label>
                          
                          <div className="space-y-4">
                            {/* Video Upload */}
                            <div className="rounded-lg p-4 border-2 border-dashed border-gray-500/30 hover:border-[#c70007] transition-colors" style={{backgroundColor: '#1c1816'}}>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Video File
                              </label>
                              
                              {newProduct.videoFile ? (
                                <div className="relative group">
                                  <div className="w-full h-48 rounded-lg overflow-hidden border-2 flex items-center justify-center" style={{borderColor: '#c70007', backgroundColor: '#0a0a0a'}}>
                                    <div className="flex flex-col items-center gap-2">
                                      <div className="text-3xl">🎬</div>
                                      <div className="text-center">
                                        <p className="text-white font-semibold text-sm">{newProduct.videoFileName || 'Video selected'}</p>
                                        <p className="text-gray-400 text-xs">Ready to upload</p>
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setNewProduct({
                                      ...newProduct,
                                      videoFile: null,
                                      videoFileName: ''
                                    })}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                    title="Remove video"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : newProduct.video_url ? (
                                <div className="relative group">
                                  <div className="w-full h-48 rounded-lg overflow-hidden border-2 border-yellow-500 flex items-center justify-center" style={{backgroundColor: '#0a0a0a'}}>
                                    <div className="flex flex-col items-center gap-2">
                                      <div className="text-3xl">🎬</div>
                                      <p className="text-white text-sm">Current video</p>
                                    </div>
                                  </div>
                                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'video/mp4,video/webm,video/ogg,video/quicktime';
                                        input.onchange = (e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const maxSize = 500 * 1024 * 1024; // 500MB
                                            if (file.size > maxSize) {
                                              alert(`Video file is too large. Maximum size is 500MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
                                              return;
                                            }
                                            setNewProduct({
                                              ...newProduct,
                                              videoFile: file,
                                              videoFileName: file.name
                                            });
                                          }
                                        };
                                        input.click();
                                      }}
                                      className="px-3 py-1 text-white text-sm rounded-md flex items-center gap-1 hover:opacity-80 transition-colors" style={{backgroundColor: '#c70007'}}
                                    >
                                      <Edit className="w-4 h-4" /> Replace
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <div className="text-4xl mb-2">📹</div>
                                  <div className="mt-2 flex text-sm text-gray-400 justify-center flex-col">
                                    <label
                                      htmlFor="video-upload"
                                      className="relative cursor-pointer rounded-md font-medium focus-within:outline-none hover:opacity-80 transition-colors" style={{backgroundColor: '#1c1816', color: '#c70007'}}
                                    >
                                      <span>Upload product video</span>
                                      <input
                                        id="video-upload"
                                        name="video-upload"
                                        type="file"
                                        className="sr-only"
                                        accept="video/mp4,video/webm,video/ogg,video/quicktime"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const maxSize = 500 * 1024 * 1024; // 500MB
                                            if (file.size > maxSize) {
                                              alert(`Video file is too large. Maximum size is 500MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
                                              return;
                                            }
                                            setNewProduct({
                                              ...newProduct,
                                              videoFile: file,
                                              videoFileName: file.name
                                            });
                                          }
                                        }}
                                      />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-2">
                                    MP4, WebM, OGG up to 500MB
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Video Preview Section */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-300 flex items-center">
                              Video Preview
                              <span className="ml-2 text-xs text-gray-400">
                                {(newProduct.videoFile || newProduct.video_url) ? '(1/1 selected)' : '(0/1 selected)'}
                              </span>
                            </h4>
                            
                            {(newProduct.videoFile || newProduct.video_url) && (
                              <div className="aspect-video rounded-lg overflow-hidden border-2 shadow-lg" style={{borderColor: '#c70007', backgroundColor: '#0a0a0a'}}>
                                {newProduct.videoFile ? (
                                  <video
                                    controls
                                    className="w-full h-full"
                                    style={{backgroundColor: '#1c1816'}}
                                  >
                                    <source src={URL.createObjectURL(newProduct.videoFile)} />
                                    Your browser does not support the video tag.
                                  </video>
                                ) : newProduct.video_url ? (
                                  <video
                                    controls
                                    className="w-full h-full"
                                    style={{backgroundColor: '#1c1816'}}
                                  >
                                    <source src={newProduct.video_url} />
                                    Your browser does not support the video tag.
                                  </video>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
              <motion.button
                type="button"
                onClick={onClose}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  formLoading 
                    ? 'text-gray-500 cursor-not-allowed' 
                    : 'text-white hover:opacity-80'
                }`}
                style={formLoading ? {backgroundColor: '#1c1816'} : {backgroundColor: '#1c1816'}}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={formLoading}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                className={`px-6 py-2 rounded-lg transition-colors flex items-center ${
                  formLoading
                    ? 'cursor-not-allowed'
                    : 'hover:opacity-80'
                } text-white`}
                style={formLoading ? {backgroundColor: '#c70007', opacity: 0.6} : {backgroundColor: '#c70007'}}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {editProductId ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editProductId ? 'Update Product' : 'Add Product'}
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Template Selection Modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            className="relative w-full max-w-4xl max-h-[80vh] overflow-auto bg-gray-800 border border-purple-500/30 rounded-2xl shadow-2xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Select Product Template</h3>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.keys(getRelevantTemplates()).length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-400 text-lg">No templates available for "{newProduct.category_name}" category.</p>
                    <p className="text-gray-500 text-sm mt-2">Templates are available for: Keyboards, Mice, Fans, Water Coolers, and Cases</p>
                  </div>
                ) : (
                  Object.entries(getRelevantTemplates()).map(([key, template]) => (
                    <motion.div
                      key={key}
                      className="p-4 rounded-lg border border-gray-500/30 cursor-pointer transition-all" 
                      style={{backgroundColor: '#1c1816', borderColor: '#c70007'}} 
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#c70007'} 
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(107, 114, 128, 0.3)'}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => applyTemplate(key)}
                    >
                      <h4 className="text-lg font-semibold text-white mb-2">{template.name}</h4>
                      <div className="text-sm text-gray-300 space-y-1">
                        <p><span style={{color: '#c70007'}}>Model:</span> {template.data.product_model}</p>
                        {template.data.dpi && <p><span style={{color: '#c70007'}}>DPI:</span> {template.data.dpi}</p>}
                        {template.data.fan_speed && <p><span style={{color: '#c70007'}}>Speed:</span> {template.data.fan_speed}</p>}
                        {template.data.motherboard && <p><span style={{color: '#c70007'}}>Motherboard:</span> {template.data.motherboard}</p>}
                        {template.data.axis && <p><span style={{color: '#c70007'}}>Switch:</span> {template.data.axis}</p>}
                        {template.data.number_of_keys && <p><span style={{color: '#c70007'}}>Keys:</span> {template.data.number_of_keys}</p>}
                      </div>
                      <div className="mt-3 text-xs font-medium" style={{color: '#c70007'}}>Click to apply template</div>
                    </motion.div>
                  ))
                )}
              </div>
              
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowTemplates(false)}
                  className="px-6 py-2 text-white rounded-lg transition-colors hover:opacity-80" style={{backgroundColor: '#1c1816'}}
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}