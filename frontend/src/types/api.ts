export type UserRole = 'ADMINISTRADOR' | 'CAJERO' | 'CLIENTE';

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
}

export interface UserRecord {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: UserRole;
  createdAt: string;
}

export type CreateStaffInput = Pick<
  UserRecord,
  'email' | 'firstName' | 'lastName' | 'role'
> & {
  password: string;
  phone?: string;
};

export type UpdateStaffInput = Partial<CreateStaffInput>;

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
}

export interface CategoryInput {
  name: string;
  description?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  costPrice: number;
  salePrice: number;
  stock: number;
  categoryId: number;
  imageUrl: string | null;
  category: Category;
}

export type PublicProduct = Omit<Product, 'costPrice'>;

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterCustomer extends Credentials {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface ProductInput {
  name: string;
  description?: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  categoryId: number;
}

export type PaymentMethod =
  'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'MOCKPAY';

export type OrderStatus =
  'PENDIENTE' | 'PAGADO' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO';

export interface CartApiItem {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  product: PublicProduct;
}

export interface CartApiResponse {
  id: number;
  customerId: number;
  items: CartApiItem[];
}

export interface Address {
  id: number;
  userId: number;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
  createdAt: string;
}

export interface AddressInput {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault?: boolean;
}

export interface SaleItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: Product;
}

export interface SaleRecord {
  id: number;
  cashierId: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
  items: SaleItem[];
  cashier: {
    firstName: string | null;
    lastName: string | null;
    email?: string;
  };
}

export interface CreateSaleInput {
  paymentMethod: PaymentMethod;
  items: Array<{ productId: number; quantity: number }>;
}

export interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: PublicProduct;
}

export interface OrderRecord {
  id: number;
  customerId: number;
  addressId: number;
  totalAmount: number;
  status: OrderStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  address: Address;
  items: OrderItem[];
}

export interface CheckoutResponse {
  order: OrderRecord;
  checkout_url: string | null;
  payment_error?: string;
  message?: string;
}

export interface CashRegister {
  id: number;
  openedById: number;
  closedById: number | null;
  openingBalance: number;
  closingBalance: number | null;
  expectedBalance: number | null;
  difference: number | null;
  status: 'ABIERTA' | 'CERRADA';
  openedAt: string;
  closedAt: string | null;
  openedBy?: {
    firstName: string | null;
    lastName: string | null;
  };
}

export type CashRegisterStatus =
  | { status: 'CERRADA'; message: string; data?: CashRegister }
  | { status: 'ABIERTA'; data: CashRegister };

export interface CashRegisterInput {
  openingBalance: number;
}

export interface CloseCashRegisterInput {
  closingBalance: number;
}
