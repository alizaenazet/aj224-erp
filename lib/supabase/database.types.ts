
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "attachments": {
                  Row: {
                    "bucket": string,"category": string,"created_at": string,"entity_id": string,"entity_type": string,"file_name": string,"id": string,"mime_type": string,"path": string,"size_bytes": number,"uploaded_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "bucket": string,"category": string,"created_at"?: string,"entity_id": string,"entity_type": string,"file_name": string,"id"?: string,"mime_type": string,"path": string,"size_bytes": number,"uploaded_by"?: string | null
                  }
                  Update: {
                    "bucket"?: string,"category"?: string,"created_at"?: string,"entity_id"?: string,"entity_type"?: string,"file_name"?: string,"id"?: string,"mime_type"?: string,"path"?: string,"size_bytes"?: number,"uploaded_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "attachments_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"changed_fields": (string)[] | null,"created_at": string,"id": number,"new_values": Json | null,"old_values": Json | null,"reason": string | null,"record_id": string,"table_name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"changed_fields"?: (string)[] | null,"created_at"?: string,"id"?: never,"new_values"?: Json | null,"old_values"?: Json | null,"reason"?: string | null,"record_id": string,"table_name": string
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"changed_fields"?: (string)[] | null,"created_at"?: string,"id"?: never,"new_values"?: Json | null,"old_values"?: Json | null,"reason"?: string | null,"record_id"?: string,"table_name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"certificate_types": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"is_active": boolean,"name": string,"updated_at": string,"validity_months": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"name": string,"updated_at"?: string,"validity_months"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"name"?: string,"updated_at"?: string,"validity_months"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"client_activities": {
                  Row: {
                    "activity_date": string,"client_id": string,"created_at": string,"follow_up_date": string | null,"follow_up_done_at": string | null,"id": string,"kind": string,"notes": string,"owner_id": string | null,"tender_id": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activity_date": string,"client_id": string,"created_at"?: string,"follow_up_date"?: string | null,"follow_up_done_at"?: string | null,"id"?: string,"kind": string,"notes": string,"owner_id"?: string | null,"tender_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "activity_date"?: string,"client_id"?: string,"created_at"?: string,"follow_up_date"?: string | null,"follow_up_done_at"?: string | null,"id"?: string,"kind"?: string,"notes"?: string,"owner_id"?: string | null,"tender_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "client_activities_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "client_tender_stats"
      referencedColumns: ["client_id"]
    },{
      foreignKeyName: "client_activities_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "client_activities_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "client_activities_tender_id_fkey"
      columns: ["tender_id"]
isOneToOne: false
      referencedRelation: "tenders"
      referencedColumns: ["id"]
    }
                  ]
                },"client_contacts": {
                  Row: {
                    "client_id": string,"created_at": string,"email": string | null,"id": string,"name": string,"notes": string | null,"phone": string | null,"position": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id": string,"created_at"?: string,"email"?: string | null,"id"?: string,"name": string,"notes"?: string | null,"phone"?: string | null,"position"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "client_id"?: string,"created_at"?: string,"email"?: string | null,"id"?: string,"name"?: string,"notes"?: string | null,"phone"?: string | null,"position"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "client_contacts_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "client_tender_stats"
      referencedColumns: ["client_id"]
    },{
      foreignKeyName: "client_contacts_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    }
                  ]
                },"clients": {
                  Row: {
                    "address": string | null,"created_at": string,"created_by": string | null,"id": string,"is_active": boolean,"kind": string,"name": string,"notes": string | null,"npwp": string | null,"payment_term_days": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"is_active"?: boolean,"kind": string,"name": string,"notes"?: string | null,"npwp"?: string | null,"payment_term_days"?: number,"updated_at"?: string
                  }
                  Update: {
                    "address"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"is_active"?: boolean,"kind"?: string,"name"?: string,"notes"?: string | null,"npwp"?: string | null,"payment_term_days"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "clients_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"company_bank_accounts": {
                  Row: {
                    "account_holder": string,"account_number": string,"bank_name": string,"created_at": string,"id": string,"is_active": boolean,"is_default": boolean,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "account_holder": string,"account_number": string,"bank_name": string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"is_default"?: boolean,"updated_at"?: string
                  }
                  Update: {
                    "account_holder"?: string,"account_number"?: string,"bank_name"?: string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"is_default"?: boolean,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"company_profile": {
                  Row: {
                    "address": string | null,"email": string | null,"id": boolean,"is_pkp": boolean,"logo_path": string | null,"name": string,"npwp": string | null,"phone": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"email"?: string | null,"id"?: boolean,"is_pkp"?: boolean,"logo_path"?: string | null,"name": string,"npwp"?: string | null,"phone"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "address"?: string | null,"email"?: string | null,"id"?: boolean,"is_pkp"?: boolean,"logo_path"?: string | null,"name"?: string,"npwp"?: string | null,"phone"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"cost_categories": {
                  Row: {
                    "code": string,"created_at": string,"id": string,"is_active": boolean,"is_overhead": boolean,"name": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"is_overhead"?: boolean,"name": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "code"?: string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"is_overhead"?: boolean,"name"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"document_sequences": {
                  Row: {
                    "doc_type": string,"last_value": number,"period_key": string
                  }
                  ComputedFields: never
                  Insert: {
                    "doc_type": string,"last_value": number,"period_key": string
                  }
                  Update: {
                    "doc_type"?: string,"last_value"?: number,"period_key"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "document_sequences_doc_type_fkey"
      columns: ["doc_type"]
isOneToOne: false
      referencedRelation: "document_types"
      referencedColumns: ["code"]
    }
                  ]
                },"document_types": {
                  Row: {
                    "code": string,"format": string,"label": string,"reset_period": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"format": string,"label": string,"reset_period": string,"updated_at"?: string
                  }
                  Update: {
                    "code"?: string,"format"?: string,"label"?: string,"reset_period"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"employee_certificates": {
                  Row: {
                    "certificate_no": string | null,"certificate_type_id": string,"created_at": string,"created_by": string | null,"employee_id": string,"expiry_date": string | null,"id": string,"issued_date": string,"issuer": string | null,"notes": string | null,"training_id": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "certificate_no"?: string | null,"certificate_type_id": string,"created_at"?: string,"created_by"?: string | null,"employee_id": string,"expiry_date"?: string | null,"id"?: string,"issued_date": string,"issuer"?: string | null,"notes"?: string | null,"training_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "certificate_no"?: string | null,"certificate_type_id"?: string,"created_at"?: string,"created_by"?: string | null,"employee_id"?: string,"expiry_date"?: string | null,"id"?: string,"issued_date"?: string,"issuer"?: string | null,"notes"?: string | null,"training_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "employee_certificates_certificate_type_id_fkey"
      columns: ["certificate_type_id"]
isOneToOne: false
      referencedRelation: "certificate_types"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "employee_certificates_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "employee_certificates_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "employees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "employee_certificates_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "training_needs"
      referencedColumns: ["employee_id"]
    },{
      foreignKeyName: "employee_certificates_training_id_fkey"
      columns: ["training_id"]
isOneToOne: false
      referencedRelation: "trainings"
      referencedColumns: ["id"]
    }
                  ]
                },"employee_pay_settings": {
                  Row: {
                    "base_salary": number | null,"created_at": string,"daily_wage": number | null,"employee_id": string,"field_allowance_per_day": number,"fixed_allowance": number,"fixed_deduction": number,"meal_allowance_per_day": number,"overtime_rate_per_hour": number,"pay_type": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "base_salary"?: number | null,"created_at"?: string,"daily_wage"?: number | null,"employee_id": string,"field_allowance_per_day"?: number,"fixed_allowance"?: number,"fixed_deduction"?: number,"meal_allowance_per_day"?: number,"overtime_rate_per_hour"?: number,"pay_type": string,"updated_at"?: string
                  }
                  Update: {
                    "base_salary"?: number | null,"created_at"?: string,"daily_wage"?: number | null,"employee_id"?: string,"field_allowance_per_day"?: number,"fixed_allowance"?: number,"fixed_deduction"?: number,"meal_allowance_per_day"?: number,"overtime_rate_per_hour"?: number,"pay_type"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "employee_pay_settings_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: true
      referencedRelation: "employees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "employee_pay_settings_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: true
      referencedRelation: "training_needs"
      referencedColumns: ["employee_id"]
    }
                  ]
                },"employees": {
                  Row: {
                    "address": string | null,"bank_account_holder": string | null,"bank_account_number": string | null,"bank_name": string | null,"birth_date": string | null,"birth_place": string | null,"blood_type": string | null,"bpjs_number": string | null,"created_at": string,"created_by": string | null,"emergency_contact_name": string | null,"emergency_contact_phone": string | null,"employee_no": string,"employment_status": string,"exit_date": string | null,"full_name": string,"id": string,"is_active": boolean | null,"join_date": string,"nik_ktp": string | null,"phone": string | null,"position_id": string,"updated_at": string,"work_type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"bank_account_holder"?: string | null,"bank_account_number"?: string | null,"bank_name"?: string | null,"birth_date"?: string | null,"birth_place"?: string | null,"blood_type"?: string | null,"bpjs_number"?: string | null,"created_at"?: string,"created_by"?: string | null,"emergency_contact_name"?: string | null,"emergency_contact_phone"?: string | null,"employee_no": string,"employment_status": string,"exit_date"?: string | null,"full_name": string,"id"?: string,"is_active"?: never,"join_date": string,"nik_ktp"?: string | null,"phone"?: string | null,"position_id": string,"updated_at"?: string,"work_type": string
                  }
                  Update: {
                    "address"?: string | null,"bank_account_holder"?: string | null,"bank_account_number"?: string | null,"bank_name"?: string | null,"birth_date"?: string | null,"birth_place"?: string | null,"blood_type"?: string | null,"bpjs_number"?: string | null,"created_at"?: string,"created_by"?: string | null,"emergency_contact_name"?: string | null,"emergency_contact_phone"?: string | null,"employee_no"?: string,"employment_status"?: string,"exit_date"?: string | null,"full_name"?: string,"id"?: string,"is_active"?: never,"join_date"?: string,"nik_ktp"?: string | null,"phone"?: string | null,"position_id"?: string,"updated_at"?: string,"work_type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "employees_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "employees_position_id_fkey"
      columns: ["position_id"]
isOneToOne: false
      referencedRelation: "positions"
      referencedColumns: ["id"]
    }
                  ]
                },"import_runs": {
                  Row: {
                    "created_at": string,"created_by": string,"errors": NonNullable<Json>,"failed_rows": number,"file_name": string,"id": string,"imported_rows": number,"template": string,"total_rows": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string,"errors"?: NonNullable<Json>,"failed_rows": number,"file_name": string,"id"?: string,"imported_rows": number,"template": string,"total_rows": number
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"errors"?: NonNullable<Json>,"failed_rows"?: number,"file_name"?: string,"id"?: string,"imported_rows"?: number,"template"?: string,"total_rows"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "import_runs_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"item_categories": {
                  Row: {
                    "created_at": string,"id": string,"is_active": boolean,"kind": string,"name": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_active"?: boolean,"kind": string,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_active"?: boolean,"kind"?: string,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"job_runs": {
                  Row: {
                    "check_name": string,"finished_at": string | null,"id": number,"message": string | null,"started_at": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "check_name": string,"finished_at"?: string | null,"id"?: never,"message"?: string | null,"started_at"?: string,"status": string
                  }
                  Update: {
                    "check_name"?: string,"finished_at"?: string | null,"id"?: never,"message"?: string | null,"started_at"?: string,"status"?: string
                  }
                  Relationships: [
                    
                  ]
                },"locations": {
                  Row: {
                    "address": string | null,"code": string,"created_at": string,"id": string,"is_active": boolean,"name": string,"type": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"code": string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"name": string,"type": string,"updated_at"?: string
                  }
                  Update: {
                    "address"?: string | null,"code"?: string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"name"?: string,"type"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"notifications": {
                  Row: {
                    "body": string | null,"category": string,"created_at": string,"dedupe_key": string | null,"id": string,"link": string | null,"read_at": string | null,"recipient_id": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"category"?: string,"created_at"?: string,"dedupe_key"?: string | null,"id"?: string,"link"?: string | null,"read_at"?: string | null,"recipient_id": string,"title": string
                  }
                  Update: {
                    "body"?: string | null,"category"?: string,"created_at"?: string,"dedupe_key"?: string | null,"id"?: string,"link"?: string | null,"read_at"?: string | null,"recipient_id"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_recipient_id_fkey"
      columns: ["recipient_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"position_required_certificates": {
                  Row: {
                    "certificate_type_id": string,"position_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "certificate_type_id": string,"position_id": string
                  }
                  Update: {
                    "certificate_type_id"?: string,"position_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "position_required_certificates_certificate_type_id_fkey"
      columns: ["certificate_type_id"]
isOneToOne: false
      referencedRelation: "certificate_types"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "position_required_certificates_position_id_fkey"
      columns: ["position_id"]
isOneToOne: false
      referencedRelation: "positions"
      referencedColumns: ["id"]
    }
                  ]
                },"positions": {
                  Row: {
                    "created_at": string,"id": string,"is_active": boolean,"name": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_active"?: boolean,"name": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_active"?: boolean,"name"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string,"employee_id": string | null,"full_name": string,"id": string,"is_active": boolean,"role": Database["public"]['Enums']["app_role"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email": string,"employee_id"?: string | null,"full_name": string,"id": string,"is_active"?: boolean,"role": Database["public"]['Enums']["app_role"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"employee_id"?: string | null,"full_name"?: string,"id"?: string,"is_active"?: boolean,"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: true
      referencedRelation: "employees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profiles_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: true
      referencedRelation: "training_needs"
      referencedColumns: ["employee_id"]
    }
                  ]
                },"scheduled_checks": {
                  Row: {
                    "description": string | null,"enabled": boolean,"function_name": unknown,"name": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: string | null,"enabled"?: boolean,"function_name": unknown,"name": string,"sort_order"?: number
                  }
                  Update: {
                    "description"?: string | null,"enabled"?: boolean,"function_name"?: unknown,"name"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"stage_templates": {
                  Row: {
                    "created_at": string,"default_weight": number,"id": string,"is_active": boolean,"name": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"default_weight": number,"id"?: string,"is_active"?: boolean,"name": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"default_weight"?: number,"id"?: string,"is_active"?: boolean,"name"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"suppliers": {
                  Row: {
                    "address": string | null,"bank_account_holder": string | null,"bank_account_number": string | null,"bank_name": string | null,"category": string,"contact_name": string | null,"created_at": string,"email": string | null,"id": string,"is_active": boolean,"name": string,"notes": string | null,"npwp": string | null,"payment_term_days": number,"phone": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"bank_account_holder"?: string | null,"bank_account_number"?: string | null,"bank_name"?: string | null,"category": string,"contact_name"?: string | null,"created_at"?: string,"email"?: string | null,"id"?: string,"is_active"?: boolean,"name": string,"notes"?: string | null,"npwp"?: string | null,"payment_term_days"?: number,"phone"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "address"?: string | null,"bank_account_holder"?: string | null,"bank_account_number"?: string | null,"bank_name"?: string | null,"category"?: string,"contact_name"?: string | null,"created_at"?: string,"email"?: string | null,"id"?: string,"is_active"?: boolean,"name"?: string,"notes"?: string | null,"npwp"?: string | null,"payment_term_days"?: number,"phone"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"system_parameters": {
                  Row: {
                    "backdate_days": number,"cert_expiry_warning_days": number,"health_critical_points": number,"health_warning_points": number,"id": boolean,"monthly_salary_divisor": number,"ppn_rate": number,"standard_work_hours": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "backdate_days"?: number,"cert_expiry_warning_days"?: number,"health_critical_points"?: number,"health_warning_points"?: number,"id"?: boolean,"monthly_salary_divisor"?: number,"ppn_rate"?: number,"standard_work_hours"?: number,"updated_at"?: string
                  }
                  Update: {
                    "backdate_days"?: number,"cert_expiry_warning_days"?: number,"health_critical_points"?: number,"health_warning_points"?: number,"id"?: boolean,"monthly_salary_divisor"?: number,"ppn_rate"?: number,"standard_work_hours"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"tender_bid_revisions": {
                  Row: {
                    "id": string,"new_value": number | null,"note": string | null,"old_value": number | null,"revised_at": string,"revised_by": string | null,"tender_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"new_value"?: number | null,"note"?: string | null,"old_value"?: number | null,"revised_at"?: string,"revised_by"?: string | null,"tender_id": string
                  }
                  Update: {
                    "id"?: string,"new_value"?: number | null,"note"?: string | null,"old_value"?: number | null,"revised_at"?: string,"revised_by"?: string | null,"tender_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tender_bid_revisions_revised_by_fkey"
      columns: ["revised_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tender_bid_revisions_tender_id_fkey"
      columns: ["tender_id"]
isOneToOne: false
      referencedRelation: "tenders"
      referencedColumns: ["id"]
    }
                  ]
                },"tenders": {
                  Row: {
                    "bid_deadline": string | null,"bid_revision_note": string | null,"bid_value": number | null,"client_id": string,"closed_date": string | null,"created_at": string,"created_by": string | null,"end_owner": string | null,"estimated_cost": number | null,"id": string,"info_date": string | null,"length_kms": number | null,"location": string | null,"lost_note": string | null,"lost_reason": string | null,"name": string,"notes": string | null,"pic_id": string | null,"planned_margin": number | null,"scope": string | null,"status": string,"tower_count": number | null,"updated_at": string,"voltage_kv": number | null,"weighted_value": number | null,"win_probability": number | null,"winner_name": string | null,"winner_price": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "bid_deadline"?: string | null,"bid_revision_note"?: string | null,"bid_value"?: number | null,"client_id": string,"closed_date"?: string | null,"created_at"?: string,"created_by"?: string | null,"end_owner"?: string | null,"estimated_cost"?: number | null,"id"?: string,"info_date"?: string | null,"length_kms"?: number | null,"location"?: string | null,"lost_note"?: string | null,"lost_reason"?: string | null,"name": string,"notes"?: string | null,"pic_id"?: string | null,"planned_margin"?: never,"scope"?: string | null,"status"?: string,"tower_count"?: number | null,"updated_at"?: string,"voltage_kv"?: number | null,"weighted_value"?: never,"win_probability"?: number | null,"winner_name"?: string | null,"winner_price"?: number | null
                  }
                  Update: {
                    "bid_deadline"?: string | null,"bid_revision_note"?: string | null,"bid_value"?: number | null,"client_id"?: string,"closed_date"?: string | null,"created_at"?: string,"created_by"?: string | null,"end_owner"?: string | null,"estimated_cost"?: number | null,"id"?: string,"info_date"?: string | null,"length_kms"?: number | null,"location"?: string | null,"lost_note"?: string | null,"lost_reason"?: string | null,"name"?: string,"notes"?: string | null,"pic_id"?: string | null,"planned_margin"?: never,"scope"?: string | null,"status"?: string,"tower_count"?: number | null,"updated_at"?: string,"voltage_kv"?: number | null,"weighted_value"?: never,"win_probability"?: number | null,"winner_name"?: string | null,"winner_price"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "tenders_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "client_tender_stats"
      referencedColumns: ["client_id"]
    },{
      foreignKeyName: "tenders_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tenders_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tenders_pic_id_fkey"
      columns: ["pic_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"training_participants": {
                  Row: {
                    "certificate_id": string | null,"created_at": string,"employee_id": string,"result": string,"training_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "certificate_id"?: string | null,"created_at"?: string,"employee_id": string,"result"?: string,"training_id": string,"updated_at"?: string
                  }
                  Update: {
                    "certificate_id"?: string | null,"created_at"?: string,"employee_id"?: string,"result"?: string,"training_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "training_participants_certificate_id_fkey"
      columns: ["certificate_id"]
isOneToOne: false
      referencedRelation: "employee_certificate_list"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "training_participants_certificate_id_fkey"
      columns: ["certificate_id"]
isOneToOne: false
      referencedRelation: "employee_certificates"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "training_participants_certificate_id_fkey"
      columns: ["certificate_id"]
isOneToOne: false
      referencedRelation: "training_needs"
      referencedColumns: ["certificate_id"]
    },{
      foreignKeyName: "training_participants_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "employees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "training_participants_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "training_needs"
      referencedColumns: ["employee_id"]
    },{
      foreignKeyName: "training_participants_training_id_fkey"
      columns: ["training_id"]
isOneToOne: false
      referencedRelation: "trainings"
      referencedColumns: ["id"]
    }
                  ]
                },"trainings": {
                  Row: {
                    "certificate_type_id": string | null,"created_at": string,"created_by": string | null,"end_date": string | null,"id": string,"kind": string,"location": string | null,"name": string,"notes": string | null,"organizer": string | null,"start_date": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "certificate_type_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"end_date"?: string | null,"id"?: string,"kind": string,"location"?: string | null,"name": string,"notes"?: string | null,"organizer"?: string | null,"start_date": string,"updated_at"?: string
                  }
                  Update: {
                    "certificate_type_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"end_date"?: string | null,"id"?: string,"kind"?: string,"location"?: string | null,"name"?: string,"notes"?: string | null,"organizer"?: string | null,"start_date"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "trainings_certificate_type_id_fkey"
      columns: ["certificate_type_id"]
isOneToOne: false
      referencedRelation: "certificate_types"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "trainings_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"units": {
                  Row: {
                    "code": string,"created_at": string,"is_active": boolean,"name": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"created_at"?: string,"is_active"?: boolean,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "code"?: string,"created_at"?: string,"is_active"?: boolean,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "client_tender_stats": {
                  Row: {
                    "client_id": string,"lost_count": number | null,"lost_value": number | null,"tender_count": number | null,"win_rate_count": number | null,"win_rate_value": number | null,"won_count": number | null,"won_value": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"employee_certificate_list": {
                  Row: {
                    "certificate_no": string | null,"certificate_type_id": string,"certificate_type_name": string,"created_at": string,"days_left": number | null,"employee_active": boolean | null,"employee_id": string,"employee_name": string,"employee_no": string,"expiry_date": string | null,"id": string,"is_current": boolean | null,"issued_date": string,"issuer": string | null,"notes": string | null,"position_id": string,"status": string | null,"training_id": string | null,"work_type": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "employee_certificates_certificate_type_id_fkey"
      columns: ["certificate_type_id"]
isOneToOne: false
      referencedRelation: "certificate_types"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "employee_certificates_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "employees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "employee_certificates_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "training_needs"
      referencedColumns: ["employee_id"]
    },{
      foreignKeyName: "employee_certificates_training_id_fkey"
      columns: ["training_id"]
isOneToOne: false
      referencedRelation: "trainings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "employees_position_id_fkey"
      columns: ["position_id"]
isOneToOne: false
      referencedRelation: "positions"
      referencedColumns: ["id"]
    }
                  ]
                },"training_needs": {
                  Row: {
                    "certificate_id": string | null,"certificate_type_id": string,"certificate_type_name": string,"employee_id": string,"employee_name": string,"employee_no": string,"expiry_date": string | null,"position_id": string,"position_name": string,"status": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "employees_position_id_fkey"
      columns: ["position_id"]
isOneToOne: false
      referencedRelation: "positions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "position_required_certificates_certificate_type_id_fkey"
      columns: ["certificate_type_id"]
isOneToOne: false
      referencedRelation: "certificate_types"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "attachment_bucket":
{ Args: { "p_entity_type": string }; Returns: string
                           },
"can_access_attachment_path":
{ Args: { "p_name": string,"p_write": boolean }; Returns: boolean
                           },
"can_read_attachment":
{ Args: { "p_category": string,"p_entity_id": string,"p_entity_type": string }; Returns: boolean
                           },
"can_write_attachment":
{ Args: { "p_category": string,"p_entity_id": string,"p_entity_type": string }; Returns: boolean
                           },
"certificate_status":
{ Args: { "p_expiry": string,"p_on"?: string }; Returns: string
                           },
"check_certificate_expiry":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"check_client_followups":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"check_tender_deadlines":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"current_app_role":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["app_role"]
                           },
"custom_access_token_hook":
{ Args: { "event": Json }; Returns: Json
                           },
"format_date_id":
{ Args: { "p_date": string }; Returns: string
                           },
"has_role":
{ Args: { "roles": (Database["public"]['Enums']["app_role"])[] }; Returns: boolean
                           },
"is_active_user":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_pay_table":
{ Args: { "p_table": string }; Returns: boolean
                           },
"list_people":
{ Args: { "p_roles"?: (Database["public"]['Enums']["app_role"])[] }; Returns: {
              "full_name": string,"id": string,"role": Database["public"]['Enums']["app_role"]
            }[]
                           },
"list_users":
{ Args: Record<PropertyKey, never>; Returns: {
              "created_at": string,"email": string,"employee_id": string,"employee_name": string,"full_name": string,"id": string,"invited_at": string,"is_active": boolean,"last_sign_in_at": string,"role": Database["public"]['Enums']["app_role"],"status": string
            }[]
                           },
"log_audit_event":
{ Args: { "p_action": string,"p_data"?: Json,"p_reason": string,"p_record_id": string,"p_table_name": string }; Returns: undefined
                           },
"next_document_number":
{ Args: { "p_doc_date"?: string,"p_doc_type": string }; Returns: string
                           },
"notify_roles":
{ Args: { "p_body"?: string,"p_category": string,"p_dedupe_key"?: string,"p_link"?: string,"p_roles": (Database["public"]['Enums']["app_role"])[],"p_title": string }; Returns: undefined
                           },
"notify_user":
{ Args: { "p_body"?: string,"p_category": string,"p_dedupe_key"?: string,"p_link"?: string,"p_recipient_id": string,"p_title": string }; Returns: undefined
                           },
"run_daily_checks":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"save_stage_template":
{ Args: { "p_stages": Json }; Returns: undefined
                           },
"set_default_bank_account":
{ Args: { "p_account_id": string }; Returns: undefined
                           },
"set_position_required_certificates":
{ Args: { "p_certificate_type_ids": (string)[],"p_position_id": string }; Returns: undefined
                           },
"tender_lost_reasons":
{ Args: { "p_from": string,"p_to": string }; Returns: {
              "bid_value": number,"reason": string,"tender_count": number
            }[]
                           },
"tender_pipeline":
{ Args: Record<PropertyKey, never>; Returns: {
              "bid_value": number,"status": string,"tender_count": number,"weighted_value": number
            }[]
                           },
"tender_win_stats":
{ Args: { "p_from": string,"p_to": string }; Returns: {
              "dimension": string,"key": string,"label": string,"lost_count": number,"lost_value": number,"win_rate_count": number,"win_rate_value": number,"won_count": number,"won_value": number
            }[]
                           },
"today_wib":
{ Args: Record<PropertyKey, never>; Returns: string
                           }
          }
          Enums: {
            "app_role": "super_admin"|"director"|"marketing"|"finance"|"hcm"|"operations"|"field"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "app_role": ["super_admin", "director", "marketing", "finance", "hcm", "operations", "field"]
          }
        }
} as const
