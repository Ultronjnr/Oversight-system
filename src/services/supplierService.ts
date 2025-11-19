import { supabase } from '../lib/supabaseClient';

export interface Supplier {
  id?: string;
  name: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  vatNumber?: string;
  bankAccount?: string;
  paymentTerms?: string;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Transform Supabase snake_case data to camelCase
 */
function transformSupplierData(data: any): Supplier {
  return {
    id: data.id,
    name: data.name,
    contactPerson: data.contact_person,
    contactEmail: data.contact_email,
    contactPhone: data.contact_phone,
    address: data.address,
    city: data.city,
    postalCode: data.postal_code,
    country: data.country,
    vatNumber: data.vat_number,
    bankAccount: data.bank_account,
    paymentTerms: data.payment_terms,
    notes: data.notes,
    createdBy: data.created_by,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

/**
 * Get all suppliers
 */
export async function getSuppliers(): Promise<Supplier[]> {
  try {
    console.log('📋 Fetching suppliers...');
    
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Error fetching suppliers:', error);
      throw error;
    }

    const suppliers = (data || []).map(transformSupplierData);
    console.log('✅ Fetched suppliers:', suppliers.length);
    return suppliers;
  } catch (error: any) {
    console.error('❌ Failed to fetch suppliers:', error.message);
    return [];
  }
}

/**
 * Get supplier by ID
 */
export async function getSupplierById(id: string): Promise<Supplier | null> {
  try {
    console.log('📋 Fetching supplier:', id);
    
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error fetching supplier:', error);
      return null;
    }

    return data ? transformSupplierData(data) : null;
  } catch (error: any) {
    console.error('❌ Failed to fetch supplier:', error.message);
    return null;
  }
}

/**
 * Create new supplier
 */
export async function createSupplier(supplier: Supplier, userId: string): Promise<Supplier | null> {
  try {
    console.log('➕ Creating supplier:', supplier.name);

    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        name: supplier.name,
        contact_person: supplier.contactPerson || null,
        contact_email: supplier.contactEmail || null,
        contact_phone: supplier.contactPhone || null,
        address: supplier.address || null,
        city: supplier.city || null,
        postal_code: supplier.postalCode || null,
        country: supplier.country || 'South Africa',
        vat_number: supplier.vatNumber || null,
        bank_account: supplier.bankAccount || null,
        payment_terms: supplier.paymentTerms || null,
        notes: supplier.notes || null,
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating supplier:', error);
      throw error;
    }

    console.log('✅ Supplier created:', data.id);
    return data ? transformSupplierData(data) : null;
  } catch (error: any) {
    console.error('❌ Failed to create supplier:', error.message);
    throw error;
  }
}

/**
 * Update supplier
 */
export async function updateSupplier(id: string, supplier: Partial<Supplier>): Promise<Supplier | null> {
  try {
    console.log('✏️ Updating supplier:', id);

    const updateData: any = {};
    
    if (supplier.name) updateData.name = supplier.name;
    if (supplier.contactPerson !== undefined) updateData.contact_person = supplier.contactPerson;
    if (supplier.contactEmail !== undefined) updateData.contact_email = supplier.contactEmail;
    if (supplier.contactPhone !== undefined) updateData.contact_phone = supplier.contactPhone;
    if (supplier.address !== undefined) updateData.address = supplier.address;
    if (supplier.city !== undefined) updateData.city = supplier.city;
    if (supplier.postalCode !== undefined) updateData.postal_code = supplier.postalCode;
    if (supplier.country !== undefined) updateData.country = supplier.country;
    if (supplier.vatNumber !== undefined) updateData.vat_number = supplier.vatNumber;
    if (supplier.bankAccount !== undefined) updateData.bank_account = supplier.bankAccount;
    if (supplier.paymentTerms !== undefined) updateData.payment_terms = supplier.paymentTerms;
    if (supplier.notes !== undefined) updateData.notes = supplier.notes;

    const { data, error } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating supplier:', error);
      throw error;
    }

    console.log('✅ Supplier updated:', id);
    return data ? transformSupplierData(data) : null;
  } catch (error: any) {
    console.error('❌ Failed to update supplier:', error.message);
    throw error;
  }
}

/**
 * Delete supplier
 */
export async function deleteSupplier(id: string): Promise<boolean> {
  try {
    console.log('🗑️ Deleting supplier:', id);

    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting supplier:', error);
      throw error;
    }

    console.log('✅ Supplier deleted:', id);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to delete supplier:', error.message);
    return false;
  }
}
