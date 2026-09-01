import { useState, useEffect } from 'react';
import * as db from '../../../utils/db';

/**
 * useProductType Hook - Product Type Management
 * 
 * This custom React hook provides complete functionality for managing product types in the application.
 * A product type represents a category or template for products that can have associated schedules,
 * milestones, and component configurations.
 * 
 * Core Responsibilities:
 * - Fetching and storing product types from the database
 * - Performing CRUD operations (Create, Read, Update, Delete) on product types
 * - Filtering and sorting product types based on user preferences
 * - Managing loading states and error handling with user alerts
 * 
 * State Management:
 * The hook maintains five primary state variables. 
 * - productTypes stores the array of all product type objects fetched from the database
 * - searchTerm tracks the user's current search input to filter product types by name
 * - statusFilter allows users to show only product types with a specific status (e.g., 'valid' or 'invalid'), with 'all' showing every status
 * - sortBy controls which field is used for sorting (name, status, schedules, or components)
 * - loading indicates whether data is currently being fetched from the database.
 * 
 * Data Loading:
 * The loadProductTypes function is an asynchronous operation that fetches all product types from
 * the database when the component first mounts. It sets the loading state to true during the fetch,
 * updates the productTypes state with the retrieved data, and handles any errors by showing an
 * alert to the user. A try-catch-finally block ensures the loading state is always reset to false
 * when the operation completes, whether successful or not.
 * 
 * CRUD Operations:
 * handleAddProductType creates a new product type after checking if one with the same name already
 * exists. If a duplicate is found, an error is thrown. New product types are created in an 'INVALID'
 * status, requiring users to configure schedules, milestones, and component lead times before use.
 * 
 * handleRenameProductType updates an existing product type's name in the database. After the update
 * completes successfully, the product types list is reloaded to reflect the change.
 * 
 * handleDeleteProductType removes a single product type after confirming with the user. This operation
 * cascades to delete all associated schedules, milestones, and project records. The function returns
 * a boolean to indicate whether the deletion was actually completed (true if deleted, false if cancelled).
 * 
 * handleDeleteAllProductTypes provides a way to remove every product type at once, but requires
 * two confirmation dialogs to prevent accidental mass deletion. This is useful for resetting the
 * entire product type configuration.
 * 
 * Filtering and Sorting:
 * filteredPtList is a derived state that applies both filtering and sorting to the product types array.
 * The filtering step checks each product type against the current search term (case-insensitive name match)
 * and status filter. The sorting step then arranges results based on the sortBy preference. When sorting
 * by 'schedules' or 'components', it uses a numeric comparison (showing higher counts first), while
 * 'name' and 'status' use alphabetical comparison.
 * 
 * The hook returns an object containing all state variables, their setter functions, loading status,
 * the filtered and sorted product type list, and all handler functions for CRUD operations. This allows
 * components that use this hook to have full control over product type management.
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
    productTypes  , setProductTypes,
    searchTerm    , setSearchTerm,
    statusFilter  , setStatusFilter,
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