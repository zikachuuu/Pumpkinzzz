import { useState, useEffect } from 'react';
import * as db from '../../../utils/db';

export function useProductType(triggerAlert) {
  const [productTypes , setProductTypes]  = useState([]);
  const [searchTerm   , setSearchTerm]    = useState('');
  
  // Filtering States
  const [statusFilter , setStatusFilter]  = useState('all');
  const [inUseFilter  , setInUseFilter]   = useState('all'); // 'all', 'in-use', 'not-in-use'
  
  // Sorting State (Format: "key-direction")
  const [sortBy       , setSortBy]        = useState('name-asc');
  
  const [loading      , setLoading]       = useState(true);

  // 1. Fetch Data
  const loadProductTypes = async () => {
    setLoading(true);
    try {
      const data = await db.getProductTypes();
      setProductTypes(data);
    } catch (err) {
      triggerAlert('error', `Failed to load product types: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductTypes();
  }, []);

  // 2. CRUD Operations
  const handleAddProductType = async (name) => {
    const exists = productTypes.some(pt => pt.name.toLowerCase() === name.toLowerCase());
    if (exists) throw new Error('Product type already exists');
    
    await db.addProductType(name);
    triggerAlert('success', 'Product Type created as [INVALID]. Please configure schedules, milestones, and component lead times before use.');
    await loadProductTypes();
  };

  const handleRenameProductType = async (id, newName) => {
    const trimmedName = newName.trim();
    if (!trimmedName) throw new Error('Product type name cannot be empty');

    const exists = productTypes.some(
      pt => pt.id !== id && pt.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) throw new Error('Product type already exists');

    await db.renameProductType(id, trimmedName);
    triggerAlert('success', 'Product Type renamed successfully!');
    await loadProductTypes();
  };

  const handleDeleteProductType = async (id, name) => {
    if (!confirm(`Are you sure you want to delete Product Type "${name}"? This will delete all its schedules, milestones, and project records over cascade.`)) return false;
    
    await db.deleteProductType(id);
    triggerAlert('success', 'Product Type deleted successfully.');
    await loadProductTypes();
    return true; 
  };

  const handleDeleteAllProductTypes = async () => {
    if (!confirm('Delete all product types? This will remove all associated schedules and project links.')) return false;
    if (!confirm('This cannot be undone. Continue deleting all product types?')) return false;

    await db.deleteAllProductTypes();
    triggerAlert('success', 'All product types were deleted successfully.');
    await loadProductTypes();
    return true;
  };

  // 3. Derived State (Filtering and Sorting)
  const filteredPtList = productTypes
    .filter(pt => {
      // Search Check
      const matchSearch = pt.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Validity Status Check
      const matchStatus = statusFilter === 'all' || pt.status === statusFilter;
      
      // In-Use Check
      const matchInUse = inUseFilter === 'all' 
        ? true 
        : inUseFilter === 'in-use' 
          ? pt.in_use_count > 0 
          : pt.in_use_count === 0;

      return matchSearch && matchStatus && matchInUse;
    })
    .sort((a, b) => {
      // Split "name-asc" into key: "name", direction: "asc"
      const [key, direction] = sortBy.split('-');
      
      // Multiplying by -1 neatly flips the sort order for descending without repeating code (KISS)
      const modifier = direction === 'asc' ? 1 : -1;

      if (key === 'name') return a.name.localeCompare(b.name) * modifier;
      if (key === 'status') return a.status.localeCompare(b.status) * modifier;
      if (key === 'schedules') return (a.schedule_count - b.schedule_count) * modifier;
      if (key === 'components') return (a.component_count - b.component_count) * modifier;
      
      return 0;
    });

  // 4. Return everything the UI needs
  return {
    productTypes  , setProductTypes,
    searchTerm    , setSearchTerm,
    statusFilter  , setStatusFilter,
    inUseFilter   , setInUseFilter, // <-- Added new filter
    sortBy        , setSortBy,
    loading       ,
    filteredPtList,
    loadProductTypes,
    handleAddProductType,
    handleRenameProductType,
    handleDeleteProductType,
    handleDeleteAllProductTypes
  };
}