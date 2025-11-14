/**
 * Utility to clean up any duplicate IDs in localStorage data
 */

export const cleanupDuplicateIds = () => {
  try {
    const savedPRs = localStorage.getItem('purchaseRequisitions');
    if (savedPRs) {
      const prs = JSON.parse(savedPRs);
      const seenIds = new Set();
      const uniquePRs = [];
      
      for (const pr of prs) {
        if (!seenIds.has(pr.id)) {
          seenIds.add(pr.id);
          uniquePRs.push(pr);
        } else {
          // If duplicate found, create new unique ID
          const newId = `${pr.id}_fixed_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          uniquePRs.push({
            ...pr,
            id: newId
          });
          console.log(`Fixed duplicate ID: ${pr.id} -> ${newId}`);
        }
      }
      
      // Save cleaned data back
      localStorage.setItem('purchaseRequisitions', JSON.stringify(uniquePRs));
      console.log(`Cleaned up data: ${prs.length} -> ${uniquePRs.length} unique items`);
      
      return uniquePRs.length !== prs.length;
    }
  } catch (error) {
    console.error('Error cleaning up duplicate IDs:', error);
  }
  return false;
};

export const validateUniqueIds = (data: any[]) => {
  const ids = data.map(item => item.id);
  const uniqueIds = new Set(ids);
  return ids.length === uniqueIds.size;
};
