import { useState, useEffect } from 'react';
import * as db from '../../../utils/db'; // Adjust path if necessary depending on folder depth

/**
 * useProductTypeManager is a custom hook that encapsulates the logic for managing product types.
 * It provides state and functions for fetching, filtering, sorting, and performing CRUD operations on product types.
 * - CRUD operations include adding, renaming, deleting individual product types, and deleting all product types.
 *
 * @param {function} triggerAlert - A function to trigger alert messages in the UI.
 * @returns {object} - An object containing state variables and functions for managing product types.
 * 
 * State Variables:
 * - productTypes: Array of product type objects fetched from the database.
 * - searchTerm: String for filtering product types by name.
 * - statusFilter: String for filtering product types by status ('all', 'valid', 'invalid').
 * - sortBy: String indicating the current sorting criteria ('name', 'status', 'schedules', 'components').
 * - loading: Boolean indicating whether data is currently being fetched.
 * 
 * Functions:
 * - loadProductTypes: Fetches product types from the database and updates state.
 * - handleAddProductType: Adds a new product type to the database and refreshes the list.
 * - handleRenameProductType: Renames an existing product type in the database and refreshes the list.
 * - handleDeleteProductType: Deletes a specific product type from the database and refreshes the list.
 * - handleDeleteAllProductTypes: Deletes all product types from the database and refreshes the list.
 */

export function useProductType(triggerAlert) {
  const [productTypes , setProductTypes]  = useState([]);
  const [searchTerm   , setSearchTerm]    = useState('');
  const [statusFilter , setStatusFilter]  = useState('all');
  const [sortBy       , setSortBy]        = useState('name');
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
    await db.renameProductType(id, newName);
    triggerAlert('success', 'Product Type renamed successfully!');
    await loadProductTypes();
  };

  const handleDeleteProductType = async (id, name) => {
    if (!confirm(`Are you sure you want to delete Product Type "${name}"? This will delete all its schedules, milestones, and project records over cascade.`)) return false;
    
    await db.deleteProductType(id);
    triggerAlert('success', 'Product Type deleted successfully.');
    await loadProductTypes();
    return true; // Return true so the UI knows it was deleted
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
      const matchSearch = pt.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || pt.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      if (sortBy === 'schedules') return b.schedule_count - a.schedule_count;
      if (sortBy === 'components') return b.component_count - a.component_count;
      return 0;
    });

  // 4. Return everything the UI needs
  return {
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    sortBy, setSortBy,
    loading,
    filteredPtList,
    loadProductTypes,
    handleAddProductType,
    handleRenameProductType,
    handleDeleteProductType,
    handleDeleteAllProductTypes
  };
}