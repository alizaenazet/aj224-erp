
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
            "assignments": {
                  Row: {
                    "created_at": string,"created_by": string | null,"employee_id": string,"end_date": string | null,"id": string,"notes": string | null,"overridden_at": string | null,"overridden_by": string | null,"override_reason": string | null,"position_id": string,"project_id": string,"start_date": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"employee_id": string,"end_date"?: string | null,"id"?: string,"notes"?: string | null,"overridden_at"?: string | null,"overridden_by"?: string | null,"override_reason"?: string | null,"position_id": string,"project_id": string,"start_date": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"employee_id"?: string,"end_date"?: string | null,"id"?: string,"notes"?: string | null,"overridden_at"?: string | null,"overridden_by"?: string | null,"override_reason"?: string | null,"position_id"?: string,"project_id"?: string,"start_date"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "assignments_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignments_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "employees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignments_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "training_needs"
      referencedColumns: ["employee_id"]
    },{
      foreignKeyName: "assignments_overridden_by_fkey"
      columns: ["overridden_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignments_position_id_fkey"
      columns: ["position_id"]
isOneToOne: false
      referencedRelation: "positions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignments_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "assignments_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "assignments_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "assignments_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "assignments_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "assignments_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "assignments_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignments_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"attachment_entity_types": {
                  Row: {
                    "bucket": string,"entity_type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bucket": string,"entity_type": string
                  }
                  Update: {
                    "bucket"?: string,"entity_type"?: string
                  }
                  Relationships: [
                    
                  ]
                },"attachments": {
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
                },"attendance": {
                  Row: {
                    "created_at": string,"employee_id": string,"id": string,"notes": string | null,"overtime_hours": number,"project_id": string | null,"recorded_by": string | null,"status": string,"updated_at": string,"work_date": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"employee_id": string,"id"?: string,"notes"?: string | null,"overtime_hours"?: number,"project_id"?: string | null,"recorded_by"?: string | null,"status": string,"updated_at"?: string,"work_date": string
                  }
                  Update: {
                    "created_at"?: string,"employee_id"?: string,"id"?: string,"notes"?: string | null,"overtime_hours"?: number,"project_id"?: string | null,"recorded_by"?: string | null,"status"?: string,"updated_at"?: string,"work_date"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "attendance_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "employees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "training_needs"
      referencedColumns: ["employee_id"]
    },{
      foreignKeyName: "attendance_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "attendance_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "attendance_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "attendance_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "attendance_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "attendance_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "attendance_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_recorded_by_fkey"
      columns: ["recorded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"attendance_corrections": {
                  Row: {
                    "applied_period_id": string | null,"created_at": string,"created_by": string | null,"employee_id": string,"id": string,"new_overtime": number,"new_status": string,"old_overtime": number,"old_status": string | null,"on_project": boolean,"reason": string,"work_date": string
                  }
                  ComputedFields: never
                  Insert: {
                    "applied_period_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"employee_id": string,"id"?: string,"new_overtime"?: number,"new_status": string,"old_overtime"?: number,"old_status"?: string | null,"on_project"?: boolean,"reason": string,"work_date": string
                  }
                  Update: {
                    "applied_period_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"employee_id"?: string,"id"?: string,"new_overtime"?: number,"new_status"?: string,"old_overtime"?: number,"old_status"?: string | null,"on_project"?: boolean,"reason"?: string,"work_date"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "attendance_corrections_applied_period_id_fkey"
      columns: ["applied_period_id"]
isOneToOne: false
      referencedRelation: "payroll_period_list"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_corrections_applied_period_id_fkey"
      columns: ["applied_period_id"]
isOneToOne: false
      referencedRelation: "payroll_periods"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_corrections_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_corrections_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "employees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_corrections_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "training_needs"
      referencedColumns: ["employee_id"]
    }
                  ]
                },"attendance_days": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"project_id": string,"work_date": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"project_id": string,"work_date": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"project_id"?: string,"work_date"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "attendance_days_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_days_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "attendance_days_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "attendance_days_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "attendance_days_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "attendance_days_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "attendance_days_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "attendance_days_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_days_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
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
                },"daily_report_activities": {
                  Row: {
                    "id": string,"notes": string | null,"progress_after": number,"report_id": string,"section_id": string,"sort_order": number,"stage_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"notes"?: string | null,"progress_after": number,"report_id": string,"section_id": string,"sort_order"?: number,"stage_id": string
                  }
                  Update: {
                    "id"?: string,"notes"?: string | null,"progress_after"?: number,"report_id"?: string,"section_id"?: string,"sort_order"?: number,"stage_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "daily_report_activities_report_id_fkey"
      columns: ["report_id"]
isOneToOne: false
      referencedRelation: "daily_report_list"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "daily_report_activities_report_id_fkey"
      columns: ["report_id"]
isOneToOne: false
      referencedRelation: "daily_reports"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "daily_report_activities_section_id_fkey"
      columns: ["section_id"]
isOneToOne: false
      referencedRelation: "project_sections"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "daily_report_activities_section_id_fkey"
      columns: ["section_id"]
isOneToOne: false
      referencedRelation: "section_progress_summary"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "daily_report_activities_stage_id_fkey"
      columns: ["stage_id"]
isOneToOne: false
      referencedRelation: "project_stages"
      referencedColumns: ["id"]
    }
                  ]
                },"daily_report_obstacles": {
                  Row: {
                    "category": string,"description": string,"id": string,"report_id": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "category": string,"description": string,"id"?: string,"report_id": string,"sort_order"?: number
                  }
                  Update: {
                    "category"?: string,"description"?: string,"id"?: string,"report_id"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "daily_report_obstacles_report_id_fkey"
      columns: ["report_id"]
isOneToOne: false
      referencedRelation: "daily_report_list"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "daily_report_obstacles_report_id_fkey"
      columns: ["report_id"]
isOneToOne: false
      referencedRelation: "daily_reports"
      referencedColumns: ["id"]
    }
                  ]
                },"daily_reports": {
                  Row: {
                    "briefing_participants": number | null,"created_at": string,"effective_hours": number | null,"equipment_used": string | null,"id": string,"no_activity": boolean,"no_activity_reason": string | null,"notes": string | null,"plan_tomorrow": string | null,"project_id": string,"report_date": string,"review_comment": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"safety_briefing": boolean,"status": string,"submitted_at": string | null,"submitted_by": string | null,"updated_at": string,"weather_afternoon": string | null,"weather_midday": string | null,"weather_morning": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "briefing_participants"?: number | null,"created_at"?: string,"effective_hours"?: number | null,"equipment_used"?: string | null,"id"?: string,"no_activity"?: boolean,"no_activity_reason"?: string | null,"notes"?: string | null,"plan_tomorrow"?: string | null,"project_id": string,"report_date": string,"review_comment"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"safety_briefing"?: boolean,"status"?: string,"submitted_at"?: string | null,"submitted_by"?: string | null,"updated_at"?: string,"weather_afternoon"?: string | null,"weather_midday"?: string | null,"weather_morning"?: string | null
                  }
                  Update: {
                    "briefing_participants"?: number | null,"created_at"?: string,"effective_hours"?: number | null,"equipment_used"?: string | null,"id"?: string,"no_activity"?: boolean,"no_activity_reason"?: string | null,"notes"?: string | null,"plan_tomorrow"?: string | null,"project_id"?: string,"report_date"?: string,"review_comment"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"safety_briefing"?: boolean,"status"?: string,"submitted_at"?: string | null,"submitted_by"?: string | null,"updated_at"?: string,"weather_afternoon"?: string | null,"weather_midday"?: string | null,"weather_morning"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "daily_reports_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "daily_reports_submitted_by_fkey"
      columns: ["submitted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"delivery_note_material_lines": {
                  Row: {
                    "id": string,"material_id": string,"missing": number | null,"note_id": string,"quantity": number,"receipt_note": string | null,"received_quantity": number | null,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"material_id": string,"missing"?: number | null,"note_id": string,"quantity": number,"receipt_note"?: string | null,"received_quantity"?: number | null,"sort_order"?: number
                  }
                  Update: {
                    "id"?: string,"material_id"?: string,"missing"?: number | null,"note_id"?: string,"quantity"?: number,"receipt_note"?: string | null,"received_quantity"?: number | null,"sort_order"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "delivery_note_material_lines_material_id_fkey"
      columns: ["material_id"]
isOneToOne: false
      referencedRelation: "material_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "delivery_note_material_lines_material_id_fkey"
      columns: ["material_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["material_id"]
    },{
      foreignKeyName: "delivery_note_material_lines_material_id_fkey"
      columns: ["material_id"]
isOneToOne: false
      referencedRelation: "materials"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "delivery_note_material_lines_note_id_fkey"
      columns: ["note_id"]
isOneToOne: false
      referencedRelation: "delivery_notes"
      referencedColumns: ["id"]
    }
                  ]
                },"delivery_note_tool_lines": {
                  Row: {
                    "condition": string,"id": string,"missing": number | null,"note_id": string,"quantity": number,"receipt_note": string | null,"received_damaged": number | null,"received_good": number | null,"sort_order": number,"tool_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "condition": string,"id"?: string,"missing"?: number | null,"note_id": string,"quantity": number,"receipt_note"?: string | null,"received_damaged"?: number | null,"received_good"?: number | null,"sort_order"?: number,"tool_id": string
                  }
                  Update: {
                    "condition"?: string,"id"?: string,"missing"?: number | null,"note_id"?: string,"quantity"?: number,"receipt_note"?: string | null,"received_damaged"?: number | null,"received_good"?: number | null,"sort_order"?: number,"tool_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "delivery_note_tool_lines_note_id_fkey"
      columns: ["note_id"]
isOneToOne: false
      referencedRelation: "delivery_notes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "delivery_note_tool_lines_tool_id_fkey"
      columns: ["tool_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["tool_id"]
    },{
      foreignKeyName: "delivery_note_tool_lines_tool_id_fkey"
      columns: ["tool_id"]
isOneToOne: false
      referencedRelation: "tool_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "delivery_note_tool_lines_tool_id_fkey"
      columns: ["tool_id"]
isOneToOne: false
      referencedRelation: "tools"
      referencedColumns: ["id"]
    }
                  ]
                },"delivery_notes": {
                  Row: {
                    "cancel_reason": string | null,"cancelled_at": string | null,"created_at": string,"driver": string | null,"from_location_id": string,"id": string,"note_date": string,"notes": string | null,"number": string,"receipt_note": string | null,"received_at": string | null,"received_by": string | null,"sent_at": string | null,"sent_by": string | null,"status": string,"to_location_id": string,"updated_at": string,"vehicle": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "cancel_reason"?: string | null,"cancelled_at"?: string | null,"created_at"?: string,"driver"?: string | null,"from_location_id": string,"id"?: string,"note_date": string,"notes"?: string | null,"number": string,"receipt_note"?: string | null,"received_at"?: string | null,"received_by"?: string | null,"sent_at"?: string | null,"sent_by"?: string | null,"status"?: string,"to_location_id": string,"updated_at"?: string,"vehicle"?: string | null
                  }
                  Update: {
                    "cancel_reason"?: string | null,"cancelled_at"?: string | null,"created_at"?: string,"driver"?: string | null,"from_location_id"?: string,"id"?: string,"note_date"?: string,"notes"?: string | null,"number"?: string,"receipt_note"?: string | null,"received_at"?: string | null,"received_by"?: string | null,"sent_at"?: string | null,"sent_by"?: string | null,"status"?: string,"to_location_id"?: string,"updated_at"?: string,"vehicle"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "delivery_notes_from_location_id_fkey"
      columns: ["from_location_id"]
isOneToOne: false
      referencedRelation: "locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "delivery_notes_received_by_fkey"
      columns: ["received_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "delivery_notes_sent_by_fkey"
      columns: ["sent_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "delivery_notes_to_location_id_fkey"
      columns: ["to_location_id"]
isOneToOne: false
      referencedRelation: "locations"
      referencedColumns: ["id"]
    }
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
                    "address": string | null,"bank_account_holder": string | null,"bank_account_number": string | null,"bank_name": string | null,"birth_date": string | null,"birth_place": string | null,"blood_type": string | null,"bpjs_number": string | null,"created_at": string,"created_by": string | null,"emergency_contact_name": string | null,"emergency_contact_phone": string | null,"employee_no": string,"employment_status": string,"exit_date": string | null,"full_name": string,"id": string,"is_active": boolean | null,"join_date": string,"nik_ktp": string | null,"phone": string | null,"position_id": string,"registered_by": string | null,"updated_at": string,"verification_status": string,"work_type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"bank_account_holder"?: string | null,"bank_account_number"?: string | null,"bank_name"?: string | null,"birth_date"?: string | null,"birth_place"?: string | null,"blood_type"?: string | null,"bpjs_number"?: string | null,"created_at"?: string,"created_by"?: string | null,"emergency_contact_name"?: string | null,"emergency_contact_phone"?: string | null,"employee_no": string,"employment_status": string,"exit_date"?: string | null,"full_name": string,"id"?: string,"is_active"?: never,"join_date": string,"nik_ktp"?: string | null,"phone"?: string | null,"position_id": string,"registered_by"?: string | null,"updated_at"?: string,"verification_status"?: string,"work_type": string
                  }
                  Update: {
                    "address"?: string | null,"bank_account_holder"?: string | null,"bank_account_number"?: string | null,"bank_name"?: string | null,"birth_date"?: string | null,"birth_place"?: string | null,"blood_type"?: string | null,"bpjs_number"?: string | null,"created_at"?: string,"created_by"?: string | null,"emergency_contact_name"?: string | null,"emergency_contact_phone"?: string | null,"employee_no"?: string,"employment_status"?: string,"exit_date"?: string | null,"full_name"?: string,"id"?: string,"is_active"?: never,"join_date"?: string,"nik_ktp"?: string | null,"phone"?: string | null,"position_id"?: string,"registered_by"?: string | null,"updated_at"?: string,"verification_status"?: string,"work_type"?: string
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
    },{
      foreignKeyName: "employees_registered_by_fkey"
      columns: ["registered_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"expenses": {
                  Row: {
                    "amount": number,"cancel_reason": string | null,"cancelled_at": string | null,"cost_category_id": string,"created_at": string,"created_by": string | null,"delivery_note_id": string | null,"description": string,"expense_date": string,"id": string,"is_opening": boolean,"method": string,"no_receipt": boolean,"no_receipt_note": string | null,"payee": string | null,"project_id": string | null,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"cost_category_id": string,"created_at"?: string,"created_by"?: string | null,"delivery_note_id"?: string | null,"description": string,"expense_date": string,"id"?: string,"is_opening"?: boolean,"method"?: string,"no_receipt"?: boolean,"no_receipt_note"?: string | null,"payee"?: string | null,"project_id"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "amount"?: number,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"cost_category_id"?: string,"created_at"?: string,"created_by"?: string | null,"delivery_note_id"?: string | null,"description"?: string,"expense_date"?: string,"id"?: string,"is_opening"?: boolean,"method"?: string,"no_receipt"?: boolean,"no_receipt_note"?: string | null,"payee"?: string | null,"project_id"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "expenses_cost_category_id_fkey"
      columns: ["cost_category_id"]
isOneToOne: false
      referencedRelation: "cost_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "expenses_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "expenses_delivery_note_id_fkey"
      columns: ["delivery_note_id"]
isOneToOne: false
      referencedRelation: "delivery_notes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "expenses_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "expenses_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "expenses_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "expenses_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "expenses_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "expenses_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "expenses_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "expenses_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"field_cash_expenses": {
                  Row: {
                    "amount": number,"cancel_reason": string | null,"cost_category_id": string | null,"created_at": string,"created_by": string | null,"description": string,"employee_id": string | null,"expense_date": string,"id": string,"installment_amount": number | null,"kind": string,"no_receipt": boolean,"no_receipt_note": string | null,"project_id": string,"reject_reason": string | null,"status": string,"updated_at": string,"verified_at": string | null,"verified_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"cancel_reason"?: string | null,"cost_category_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"description": string,"employee_id"?: string | null,"expense_date": string,"id"?: string,"installment_amount"?: number | null,"kind": string,"no_receipt"?: boolean,"no_receipt_note"?: string | null,"project_id": string,"reject_reason"?: string | null,"status"?: string,"updated_at"?: string,"verified_at"?: string | null,"verified_by"?: string | null
                  }
                  Update: {
                    "amount"?: number,"cancel_reason"?: string | null,"cost_category_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string,"employee_id"?: string | null,"expense_date"?: string,"id"?: string,"installment_amount"?: number | null,"kind"?: string,"no_receipt"?: boolean,"no_receipt_note"?: string | null,"project_id"?: string,"reject_reason"?: string | null,"status"?: string,"updated_at"?: string,"verified_at"?: string | null,"verified_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "field_cash_expenses_cost_category_id_fkey"
      columns: ["cost_category_id"]
isOneToOne: false
      referencedRelation: "cost_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "field_cash_expenses_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "field_cash_expenses_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "employees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "field_cash_expenses_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "training_needs"
      referencedColumns: ["employee_id"]
    },{
      foreignKeyName: "field_cash_expenses_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "field_cash_expenses_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "field_cash_expenses_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "field_cash_expenses_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "field_cash_expenses_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "field_cash_expenses_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "field_cash_expenses_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "field_cash_expenses_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "field_cash_expenses_verified_by_fkey"
      columns: ["verified_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"field_cash_movements": {
                  Row: {
                    "amount": number,"bank_account_id": string | null,"cancel_reason": string | null,"cancelled_at": string | null,"created_at": string,"created_by": string | null,"id": string,"kind": string,"method": string,"movement_date": string,"notes": string | null,"pic_employee_id": string | null,"project_id": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"bank_account_id"?: string | null,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"kind": string,"method"?: string,"movement_date": string,"notes"?: string | null,"pic_employee_id"?: string | null,"project_id": string,"status"?: string
                  }
                  Update: {
                    "amount"?: number,"bank_account_id"?: string | null,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"kind"?: string,"method"?: string,"movement_date"?: string,"notes"?: string | null,"pic_employee_id"?: string | null,"project_id"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "field_cash_movements_bank_account_id_fkey"
      columns: ["bank_account_id"]
isOneToOne: false
      referencedRelation: "company_bank_accounts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "field_cash_movements_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "field_cash_movements_pic_employee_id_fkey"
      columns: ["pic_employee_id"]
isOneToOne: false
      referencedRelation: "employees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "field_cash_movements_pic_employee_id_fkey"
      columns: ["pic_employee_id"]
isOneToOne: false
      referencedRelation: "training_needs"
      referencedColumns: ["employee_id"]
    },{
      foreignKeyName: "field_cash_movements_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "field_cash_movements_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "field_cash_movements_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "field_cash_movements_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "field_cash_movements_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "field_cash_movements_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "field_cash_movements_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "field_cash_movements_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
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
                },"incident_actions": {
                  Row: {
                    "created_at": string,"description": string,"done_at": string | null,"done_by": string | null,"done_note": string | null,"due_date": string,"id": string,"incident_id": string,"pic_employee_id": string,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description": string,"done_at"?: string | null,"done_by"?: string | null,"done_note"?: string | null,"due_date": string,"id"?: string,"incident_id": string,"pic_employee_id": string,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string,"done_at"?: string | null,"done_by"?: string | null,"done_note"?: string | null,"due_date"?: string,"id"?: string,"incident_id"?: string,"pic_employee_id"?: string,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "incident_actions_done_by_fkey"
      columns: ["done_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "incident_actions_incident_id_fkey"
      columns: ["incident_id"]
isOneToOne: false
      referencedRelation: "incident_list"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "incident_actions_incident_id_fkey"
      columns: ["incident_id"]
isOneToOne: false
      referencedRelation: "incidents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "incident_actions_pic_employee_id_fkey"
      columns: ["pic_employee_id"]
isOneToOne: false
      referencedRelation: "employees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "incident_actions_pic_employee_id_fkey"
      columns: ["pic_employee_id"]
isOneToOne: false
      referencedRelation: "training_needs"
      referencedColumns: ["employee_id"]
    }
                  ]
                },"incident_people": {
                  Row: {
                    "employee_id": string | null,"external_name": string | null,"id": string,"incident_id": string,"injury": string | null,"involvement": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "employee_id"?: string | null,"external_name"?: string | null,"id"?: string,"incident_id": string,"injury"?: string | null,"involvement"?: string,"sort_order"?: number
                  }
                  Update: {
                    "employee_id"?: string | null,"external_name"?: string | null,"id"?: string,"incident_id"?: string,"injury"?: string | null,"involvement"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "incident_people_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "employees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "incident_people_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "training_needs"
      referencedColumns: ["employee_id"]
    },{
      foreignKeyName: "incident_people_incident_id_fkey"
      columns: ["incident_id"]
isOneToOne: false
      referencedRelation: "incident_list"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "incident_people_incident_id_fkey"
      columns: ["incident_id"]
isOneToOne: false
      referencedRelation: "incidents"
      referencedColumns: ["id"]
    }
                  ]
                },"incidents": {
                  Row: {
                    "body_parts": string | null,"cancel_reason": string | null,"cancelled_at": string | null,"chronology": string,"classification": string,"closed_at": string | null,"closed_by": string | null,"created_at": string,"direct_cause": string | null,"id": string,"immediate_action": string | null,"investigated_at": string | null,"investigated_by": string | null,"location_note": string | null,"lost_days": number,"number": string,"occurred_at": string,"project_id": string,"reported_by": string | null,"root_cause": string | null,"section_id": string | null,"status": string,"updated_at": string,"witnesses": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body_parts"?: string | null,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"chronology": string,"classification": string,"closed_at"?: string | null,"closed_by"?: string | null,"created_at"?: string,"direct_cause"?: string | null,"id"?: string,"immediate_action"?: string | null,"investigated_at"?: string | null,"investigated_by"?: string | null,"location_note"?: string | null,"lost_days"?: number,"number": string,"occurred_at": string,"project_id": string,"reported_by"?: string | null,"root_cause"?: string | null,"section_id"?: string | null,"status"?: string,"updated_at"?: string,"witnesses"?: string | null
                  }
                  Update: {
                    "body_parts"?: string | null,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"chronology"?: string,"classification"?: string,"closed_at"?: string | null,"closed_by"?: string | null,"created_at"?: string,"direct_cause"?: string | null,"id"?: string,"immediate_action"?: string | null,"investigated_at"?: string | null,"investigated_by"?: string | null,"location_note"?: string | null,"lost_days"?: number,"number"?: string,"occurred_at"?: string,"project_id"?: string,"reported_by"?: string | null,"root_cause"?: string | null,"section_id"?: string | null,"status"?: string,"updated_at"?: string,"witnesses"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "incidents_closed_by_fkey"
      columns: ["closed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "incidents_investigated_by_fkey"
      columns: ["investigated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "incidents_reported_by_fkey"
      columns: ["reported_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "incidents_section_id_fkey"
      columns: ["section_id"]
isOneToOne: false
      referencedRelation: "project_sections"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "incidents_section_id_fkey"
      columns: ["section_id"]
isOneToOne: false
      referencedRelation: "section_progress_summary"
      referencedColumns: ["id"]
    }
                  ]
                },"invoice_payments": {
                  Row: {
                    "amount_received": number,"bank_account_id": string | null,"cancel_reason": string | null,"cancelled_at": string | null,"created_at": string,"created_by": string | null,"id": string,"invoice_id": string,"is_opening": boolean,"notes": string | null,"payment_date": string,"pph_amount": number,"pph_slip_no": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_received"?: number,"bank_account_id"?: string | null,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"invoice_id": string,"is_opening"?: boolean,"notes"?: string | null,"payment_date": string,"pph_amount"?: number,"pph_slip_no"?: string | null,"status"?: string
                  }
                  Update: {
                    "amount_received"?: number,"bank_account_id"?: string | null,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"invoice_id"?: string,"is_opening"?: boolean,"notes"?: string | null,"payment_date"?: string,"pph_amount"?: number,"pph_slip_no"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "invoice_payments_bank_account_id_fkey"
      columns: ["bank_account_id"]
isOneToOne: false
      referencedRelation: "company_bank_accounts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoice_payments_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoice_payments_invoice_id_fkey"
      columns: ["invoice_id"]
isOneToOne: false
      referencedRelation: "invoice_list"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoice_payments_invoice_id_fkey"
      columns: ["invoice_id"]
isOneToOne: false
      referencedRelation: "invoices"
      referencedColumns: ["id"]
    }
                  ]
                },"invoices": {
                  Row: {
                    "cancel_reason": string | null,"cancelled_at": string | null,"created_at": string,"created_by": string | null,"description": string,"dp_deduction": number,"dpp": number,"due_date": string,"gross_amount": number,"id": string,"invoice_date": string,"issued_at": string | null,"issued_by": string | null,"kind": string,"notes": string | null,"number": string | null,"other_deduction": number,"other_deduction_note": string | null,"ppn_amount": number,"ppn_rate": number,"project_id": string,"retention_deduction": number,"status": string,"term_id": string | null,"total": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cancel_reason"?: string | null,"cancelled_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"description": string,"dp_deduction"?: number,"dpp": number,"due_date": string,"gross_amount": number,"id"?: string,"invoice_date": string,"issued_at"?: string | null,"issued_by"?: string | null,"kind": string,"notes"?: string | null,"number"?: string | null,"other_deduction"?: number,"other_deduction_note"?: string | null,"ppn_amount"?: number,"ppn_rate"?: number,"project_id": string,"retention_deduction"?: number,"status"?: string,"term_id"?: string | null,"total": number,"updated_at"?: string
                  }
                  Update: {
                    "cancel_reason"?: string | null,"cancelled_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string,"dp_deduction"?: number,"dpp"?: number,"due_date"?: string,"gross_amount"?: number,"id"?: string,"invoice_date"?: string,"issued_at"?: string | null,"issued_by"?: string | null,"kind"?: string,"notes"?: string | null,"number"?: string | null,"other_deduction"?: number,"other_deduction_note"?: string | null,"ppn_amount"?: number,"ppn_rate"?: number,"project_id"?: string,"retention_deduction"?: number,"status"?: string,"term_id"?: string | null,"total"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "invoices_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_issued_by_fkey"
      columns: ["issued_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_term_id_fkey"
      columns: ["term_id"]
isOneToOne: false
      referencedRelation: "project_term_list"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_term_id_fkey"
      columns: ["term_id"]
isOneToOne: false
      referencedRelation: "project_terms"
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
                },"kasbon_installments": {
                  Row: {
                    "amount": number,"id": string,"kasbon_id": string,"payslip_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"id"?: string,"kasbon_id": string,"payslip_id": string
                  }
                  Update: {
                    "amount"?: number,"id"?: string,"kasbon_id"?: string,"payslip_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "kasbon_installments_kasbon_id_fkey"
      columns: ["kasbon_id"]
isOneToOne: false
      referencedRelation: "kasbon_balances"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "kasbon_installments_kasbon_id_fkey"
      columns: ["kasbon_id"]
isOneToOne: false
      referencedRelation: "kasbons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "kasbon_installments_payslip_id_fkey"
      columns: ["payslip_id"]
isOneToOne: false
      referencedRelation: "payslip_list"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "kasbon_installments_payslip_id_fkey"
      columns: ["payslip_id"]
isOneToOne: false
      referencedRelation: "payslips"
      referencedColumns: ["id"]
    }
                  ]
                },"kasbons": {
                  Row: {
                    "amount": number,"cancel_reason": string | null,"cancelled_at": string | null,"created_at": string,"created_by": string | null,"description": string | null,"employee_id": string,"field_cash_expense_id": string | null,"id": string,"installment_amount": number,"kasbon_date": string,"source": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"employee_id": string,"field_cash_expense_id"?: string | null,"id"?: string,"installment_amount": number,"kasbon_date": string,"source"?: string,"status"?: string
                  }
                  Update: {
                    "amount"?: number,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"employee_id"?: string,"field_cash_expense_id"?: string | null,"id"?: string,"installment_amount"?: number,"kasbon_date"?: string,"source"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "kasbons_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "kasbons_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "employees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "kasbons_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "training_needs"
      referencedColumns: ["employee_id"]
    },{
      foreignKeyName: "kasbons_field_cash_expense_id_fkey"
      columns: ["field_cash_expense_id"]
isOneToOne: true
      referencedRelation: "field_cash_expenses"
      referencedColumns: ["id"]
    }
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
                },"material_movements": {
                  Row: {
                    "created_at": string,"created_by": string | null,"delivery_note_id": string | null,"delta": number,"id": number,"kind": string,"location_id": string,"material_id": string,"note": string | null,"quantity": number,"transaction_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"delivery_note_id"?: string | null,"delta": number,"id"?: never,"kind": string,"location_id": string,"material_id": string,"note"?: string | null,"quantity": number,"transaction_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"delivery_note_id"?: string | null,"delta"?: number,"id"?: never,"kind"?: string,"location_id"?: string,"material_id"?: string,"note"?: string | null,"quantity"?: number,"transaction_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "material_movements_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "material_movements_delivery_note_id_fkey"
      columns: ["delivery_note_id"]
isOneToOne: false
      referencedRelation: "delivery_notes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "material_movements_location_id_fkey"
      columns: ["location_id"]
isOneToOne: false
      referencedRelation: "locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "material_movements_material_id_fkey"
      columns: ["material_id"]
isOneToOne: false
      referencedRelation: "material_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "material_movements_material_id_fkey"
      columns: ["material_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["material_id"]
    },{
      foreignKeyName: "material_movements_material_id_fkey"
      columns: ["material_id"]
isOneToOne: false
      referencedRelation: "materials"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "material_movements_transaction_id_fkey"
      columns: ["transaction_id"]
isOneToOne: false
      referencedRelation: "material_transactions"
      referencedColumns: ["id"]
    }
                  ]
                },"material_stock": {
                  Row: {
                    "location_id": string,"material_id": string,"quantity": number
                  }
                  ComputedFields: never
                  Insert: {
                    "location_id": string,"material_id": string,"quantity"?: number
                  }
                  Update: {
                    "location_id"?: string,"material_id"?: string,"quantity"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "material_stock_location_id_fkey"
      columns: ["location_id"]
isOneToOne: false
      referencedRelation: "locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "material_stock_material_id_fkey"
      columns: ["material_id"]
isOneToOne: false
      referencedRelation: "material_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "material_stock_material_id_fkey"
      columns: ["material_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["material_id"]
    },{
      foreignKeyName: "material_stock_material_id_fkey"
      columns: ["material_id"]
isOneToOne: false
      referencedRelation: "materials"
      referencedColumns: ["id"]
    }
                  ]
                },"material_transaction_lines": {
                  Row: {
                    "id": string,"material_id": string,"quantity": number,"sort_order": number,"system_quantity": number | null,"transaction_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"material_id": string,"quantity": number,"sort_order"?: number,"system_quantity"?: number | null,"transaction_id": string
                  }
                  Update: {
                    "id"?: string,"material_id"?: string,"quantity"?: number,"sort_order"?: number,"system_quantity"?: number | null,"transaction_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "material_transaction_lines_material_id_fkey"
      columns: ["material_id"]
isOneToOne: false
      referencedRelation: "material_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "material_transaction_lines_material_id_fkey"
      columns: ["material_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["material_id"]
    },{
      foreignKeyName: "material_transaction_lines_material_id_fkey"
      columns: ["material_id"]
isOneToOne: false
      referencedRelation: "materials"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "material_transaction_lines_transaction_id_fkey"
      columns: ["transaction_id"]
isOneToOne: false
      referencedRelation: "material_transactions"
      referencedColumns: ["id"]
    }
                  ]
                },"material_transactions": {
                  Row: {
                    "cancel_reason": string | null,"cancelled_at": string | null,"cancelled_by": string | null,"created_at": string,"created_by": string | null,"doc_no": string | null,"id": string,"kind": string,"location_id": string,"notes": string | null,"section_id": string | null,"source": string | null,"status": string,"supplier_id": string | null,"txn_date": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cancel_reason"?: string | null,"cancelled_at"?: string | null,"cancelled_by"?: string | null,"created_at"?: string,"created_by"?: string | null,"doc_no"?: string | null,"id"?: string,"kind": string,"location_id": string,"notes"?: string | null,"section_id"?: string | null,"source"?: string | null,"status"?: string,"supplier_id"?: string | null,"txn_date": string,"updated_at"?: string
                  }
                  Update: {
                    "cancel_reason"?: string | null,"cancelled_at"?: string | null,"cancelled_by"?: string | null,"created_at"?: string,"created_by"?: string | null,"doc_no"?: string | null,"id"?: string,"kind"?: string,"location_id"?: string,"notes"?: string | null,"section_id"?: string | null,"source"?: string | null,"status"?: string,"supplier_id"?: string | null,"txn_date"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "material_transactions_cancelled_by_fkey"
      columns: ["cancelled_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "material_transactions_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "material_transactions_location_id_fkey"
      columns: ["location_id"]
isOneToOne: false
      referencedRelation: "locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "material_transactions_section_id_fkey"
      columns: ["section_id"]
isOneToOne: false
      referencedRelation: "project_sections"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "material_transactions_section_id_fkey"
      columns: ["section_id"]
isOneToOne: false
      referencedRelation: "section_progress_summary"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "material_transactions_supplier_id_fkey"
      columns: ["supplier_id"]
isOneToOne: false
      referencedRelation: "suppliers"
      referencedColumns: ["id"]
    }
                  ]
                },"materials": {
                  Row: {
                    "category_id": string,"code": string,"created_at": string,"id": string,"is_active": boolean,"min_stock": number | null,"name": string,"notes": string | null,"ownership": string,"unit_code": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": string,"code": string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"min_stock"?: number | null,"name": string,"notes"?: string | null,"ownership"?: string,"unit_code": string,"updated_at"?: string
                  }
                  Update: {
                    "category_id"?: string,"code"?: string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"min_stock"?: number | null,"name"?: string,"notes"?: string | null,"ownership"?: string,"unit_code"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "materials_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "item_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "materials_unit_code_fkey"
      columns: ["unit_code"]
isOneToOne: false
      referencedRelation: "units"
      referencedColumns: ["code"]
    }
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
                },"payroll_allocations": {
                  Row: {
                    "amount": number,"days": number,"id": string,"payslip_id": string,"project_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"days"?: number,"id"?: string,"payslip_id": string,"project_id"?: string | null
                  }
                  Update: {
                    "amount"?: number,"days"?: number,"id"?: string,"payslip_id"?: string,"project_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "payroll_allocations_payslip_id_fkey"
      columns: ["payslip_id"]
isOneToOne: false
      referencedRelation: "payslip_list"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payroll_allocations_payslip_id_fkey"
      columns: ["payslip_id"]
isOneToOne: false
      referencedRelation: "payslips"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"payroll_periods": {
                  Row: {
                    "approved_at": string | null,"approved_by": string | null,"cancel_reason": string | null,"created_at": string,"created_by": string | null,"generated_at": string | null,"group_kind": string,"id": string,"name": string,"notes": string | null,"paid_at": string | null,"period_end": string,"period_start": string,"return_note": string | null,"status": string,"submitted_at": string | null,"submitted_by": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "approved_at"?: string | null,"approved_by"?: string | null,"cancel_reason"?: string | null,"created_at"?: string,"created_by"?: string | null,"generated_at"?: string | null,"group_kind": string,"id"?: string,"name": string,"notes"?: string | null,"paid_at"?: string | null,"period_end": string,"period_start": string,"return_note"?: string | null,"status"?: string,"submitted_at"?: string | null,"submitted_by"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "approved_at"?: string | null,"approved_by"?: string | null,"cancel_reason"?: string | null,"created_at"?: string,"created_by"?: string | null,"generated_at"?: string | null,"group_kind"?: string,"id"?: string,"name"?: string,"notes"?: string | null,"paid_at"?: string | null,"period_end"?: string,"period_start"?: string,"return_note"?: string | null,"status"?: string,"submitted_at"?: string | null,"submitted_by"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payroll_periods_approved_by_fkey"
      columns: ["approved_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payroll_periods_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payroll_periods_submitted_by_fkey"
      columns: ["submitted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"payslip_adjustments": {
                  Row: {
                    "amount": number,"created_at": string,"created_by": string | null,"employee_id": string,"id": string,"kind": string,"note": string,"period_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"created_at"?: string,"created_by"?: string | null,"employee_id": string,"id"?: string,"kind": string,"note": string,"period_id": string
                  }
                  Update: {
                    "amount"?: number,"created_at"?: string,"created_by"?: string | null,"employee_id"?: string,"id"?: string,"kind"?: string,"note"?: string,"period_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payslip_adjustments_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payslip_adjustments_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "employees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payslip_adjustments_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "training_needs"
      referencedColumns: ["employee_id"]
    },{
      foreignKeyName: "payslip_adjustments_period_id_fkey"
      columns: ["period_id"]
isOneToOne: false
      referencedRelation: "payroll_period_list"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payslip_adjustments_period_id_fkey"
      columns: ["period_id"]
isOneToOne: false
      referencedRelation: "payroll_periods"
      referencedColumns: ["id"]
    }
                  ]
                },"payslips": {
                  Row: {
                    "absence_deduction": number,"absent_days": number,"active_days": number,"base_amount": number,"base_salary": number,"bpjs_deduction": number,"correction_amount": number,"created_at": string,"daily_wage": number,"employee_id": string,"field_amount": number,"field_rate": number,"fixed_allowance": number,"gross": number,"id": string,"incentive_amount": number,"incomplete_attendance": boolean,"kasbon_deduction": number,"meal_amount": number,"meal_rate": number,"net": number,"other_deduction": number,"overtime_amount": number,"overtime_hours": number,"overtime_rate": number,"paid_at": string | null,"pay_type": string,"payment_method": string | null,"period_days": number,"period_id": string,"pph21_deduction": number,"present_days": number,"project_days": number,"range_end": string,"range_start": string,"recorded_days": number,"status": string,"total_deductions": number,"unverified": boolean,"wage_amount": number
                  }
                  ComputedFields: never
                  Insert: {
                    "absence_deduction"?: number,"absent_days": number,"active_days": number,"base_amount"?: number,"base_salary"?: number,"bpjs_deduction"?: number,"correction_amount"?: number,"created_at"?: string,"daily_wage"?: number,"employee_id": string,"field_amount"?: number,"field_rate"?: number,"fixed_allowance"?: number,"gross"?: number,"id"?: string,"incentive_amount"?: number,"incomplete_attendance"?: boolean,"kasbon_deduction"?: number,"meal_amount"?: number,"meal_rate"?: number,"net"?: number,"other_deduction"?: number,"overtime_amount"?: number,"overtime_hours"?: number,"overtime_rate"?: number,"paid_at"?: string | null,"pay_type": string,"payment_method"?: string | null,"period_days": number,"period_id": string,"pph21_deduction"?: number,"present_days": number,"project_days": number,"range_end": string,"range_start": string,"recorded_days": number,"status"?: string,"total_deductions"?: number,"unverified"?: boolean,"wage_amount"?: number
                  }
                  Update: {
                    "absence_deduction"?: number,"absent_days"?: number,"active_days"?: number,"base_amount"?: number,"base_salary"?: number,"bpjs_deduction"?: number,"correction_amount"?: number,"created_at"?: string,"daily_wage"?: number,"employee_id"?: string,"field_amount"?: number,"field_rate"?: number,"fixed_allowance"?: number,"gross"?: number,"id"?: string,"incentive_amount"?: number,"incomplete_attendance"?: boolean,"kasbon_deduction"?: number,"meal_amount"?: number,"meal_rate"?: number,"net"?: number,"other_deduction"?: number,"overtime_amount"?: number,"overtime_hours"?: number,"overtime_rate"?: number,"paid_at"?: string | null,"pay_type"?: string,"payment_method"?: string | null,"period_days"?: number,"period_id"?: string,"pph21_deduction"?: number,"present_days"?: number,"project_days"?: number,"range_end"?: string,"range_start"?: string,"recorded_days"?: number,"status"?: string,"total_deductions"?: number,"unverified"?: boolean,"wage_amount"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "payslips_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "employees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payslips_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "training_needs"
      referencedColumns: ["employee_id"]
    },{
      foreignKeyName: "payslips_period_id_fkey"
      columns: ["period_id"]
isOneToOne: false
      referencedRelation: "payroll_period_list"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payslips_period_id_fkey"
      columns: ["period_id"]
isOneToOne: false
      referencedRelation: "payroll_periods"
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
                },"progress_updates": {
                  Row: {
                    "created_at": string,"created_by": string | null,"daily_report_id": string | null,"id": number,"new_progress": number,"note": string | null,"old_progress": number,"project_id": string,"section_id": string,"source": string,"stage_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"daily_report_id"?: string | null,"id"?: never,"new_progress": number,"note"?: string | null,"old_progress": number,"project_id": string,"section_id": string,"source": string,"stage_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"daily_report_id"?: string | null,"id"?: never,"new_progress"?: number,"note"?: string | null,"old_progress"?: number,"project_id"?: string,"section_id"?: string,"source"?: string,"stage_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "progress_updates_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "progress_updates_daily_report_id_fkey"
      columns: ["daily_report_id"]
isOneToOne: false
      referencedRelation: "daily_report_list"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "progress_updates_daily_report_id_fkey"
      columns: ["daily_report_id"]
isOneToOne: false
      referencedRelation: "daily_reports"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "progress_updates_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "progress_updates_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "progress_updates_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "progress_updates_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "progress_updates_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "progress_updates_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "progress_updates_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "progress_updates_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "progress_updates_section_id_fkey"
      columns: ["section_id"]
isOneToOne: false
      referencedRelation: "project_sections"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "progress_updates_section_id_fkey"
      columns: ["section_id"]
isOneToOne: false
      referencedRelation: "section_progress_summary"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "progress_updates_stage_id_fkey"
      columns: ["stage_id"]
isOneToOne: false
      referencedRelation: "project_stages"
      referencedColumns: ["id"]
    }
                  ]
                },"project_addenda": {
                  Row: {
                    "addendum_date": string,"addendum_no": string,"created_at": string,"created_by": string | null,"description": string | null,"id": string,"new_finish_date": string | null,"new_value": number | null,"project_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "addendum_date": string,"addendum_no": string,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"id"?: string,"new_finish_date"?: string | null,"new_value"?: number | null,"project_id": string
                  }
                  Update: {
                    "addendum_date"?: string,"addendum_no"?: string,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"id"?: string,"new_finish_date"?: string | null,"new_value"?: number | null,"project_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_addenda_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_addenda_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_addenda_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_addenda_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_addenda_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_addenda_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_addenda_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_addenda_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_addenda_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"project_budgets": {
                  Row: {
                    "amount": number,"cost_category_id": string,"created_at": string,"id": string,"notes": string | null,"project_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount"?: number,"cost_category_id": string,"created_at"?: string,"id"?: string,"notes"?: string | null,"project_id": string,"updated_at"?: string
                  }
                  Update: {
                    "amount"?: number,"cost_category_id"?: string,"created_at"?: string,"id"?: string,"notes"?: string | null,"project_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_budgets_cost_category_id_fkey"
      columns: ["cost_category_id"]
isOneToOne: false
      referencedRelation: "cost_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_budgets_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_budgets_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_budgets_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_budgets_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_budgets_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_budgets_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_budgets_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_budgets_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"project_contracts": {
                  Row: {
                    "contract_date": string | null,"contract_no": string | null,"contract_value": number,"created_at": string,"maintenance_months": number | null,"ppn_applicable": boolean,"project_id": string,"scope": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "contract_date"?: string | null,"contract_no"?: string | null,"contract_value"?: number,"created_at"?: string,"maintenance_months"?: number | null,"ppn_applicable"?: boolean,"project_id": string,"scope"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "contract_date"?: string | null,"contract_no"?: string | null,"contract_value"?: number,"created_at"?: string,"maintenance_months"?: number | null,"ppn_applicable"?: boolean,"project_id"?: string,"scope"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_contracts_project_id_fkey"
      columns: ["project_id"]
isOneToOne: true
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_contracts_project_id_fkey"
      columns: ["project_id"]
isOneToOne: true
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_contracts_project_id_fkey"
      columns: ["project_id"]
isOneToOne: true
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_contracts_project_id_fkey"
      columns: ["project_id"]
isOneToOne: true
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_contracts_project_id_fkey"
      columns: ["project_id"]
isOneToOne: true
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_contracts_project_id_fkey"
      columns: ["project_id"]
isOneToOne: true
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_contracts_project_id_fkey"
      columns: ["project_id"]
isOneToOne: true
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_contracts_project_id_fkey"
      columns: ["project_id"]
isOneToOne: true
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"project_sections": {
                  Row: {
                    "circuits": number,"code": string,"created_at": string,"id": string,"kms": number | null,"length_km": number,"notes": string | null,"planned_finish": string,"planned_start": string,"project_id": string,"sort_order": number,"tower_count": number | null,"tower_from": string,"tower_to": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "circuits": number,"code": string,"created_at"?: string,"id"?: string,"kms"?: never,"length_km": number,"notes"?: string | null,"planned_finish": string,"planned_start": string,"project_id": string,"sort_order"?: number,"tower_count"?: number | null,"tower_from": string,"tower_to": string,"updated_at"?: string
                  }
                  Update: {
                    "circuits"?: number,"code"?: string,"created_at"?: string,"id"?: string,"kms"?: never,"length_km"?: number,"notes"?: string | null,"planned_finish"?: string,"planned_start"?: string,"project_id"?: string,"sort_order"?: number,"tower_count"?: number | null,"tower_from"?: string,"tower_to"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"project_stages": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"project_id": string,"sort_order": number,"updated_at": string,"weight": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"project_id": string,"sort_order"?: number,"updated_at"?: string,"weight": number
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"project_id"?: string,"sort_order"?: number,"updated_at"?: string,"weight"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_stages_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_stages_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_stages_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_stages_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_stages_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_stages_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_stages_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_stages_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"project_terms": {
                  Row: {
                    "amount": number | null,"condition_date": string | null,"condition_progress": number | null,"condition_type": string,"created_at": string,"id": string,"kind": string,"name": string,"notes": string | null,"percent": number | null,"project_id": string,"ready_at": string | null,"ready_by": string | null,"sort_order": number,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount"?: number | null,"condition_date"?: string | null,"condition_progress"?: number | null,"condition_type": string,"created_at"?: string,"id"?: string,"kind": string,"name": string,"notes"?: string | null,"percent"?: number | null,"project_id": string,"ready_at"?: string | null,"ready_by"?: string | null,"sort_order"?: number,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "amount"?: number | null,"condition_date"?: string | null,"condition_progress"?: number | null,"condition_type"?: string,"created_at"?: string,"id"?: string,"kind"?: string,"name"?: string,"notes"?: string | null,"percent"?: number | null,"project_id"?: string,"ready_at"?: string | null,"ready_by"?: string | null,"sort_order"?: number,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_terms_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_terms_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_terms_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_terms_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_terms_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_terms_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_terms_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_terms_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_terms_ready_by_fkey"
      columns: ["ready_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"projects": {
                  Row: {
                    "client_id": string,"code": string,"created_at": string,"created_by": string | null,"end_owner": string | null,"finish_date": string | null,"id": string,"length_kms": number | null,"location_id": string | null,"name": string,"notes": string | null,"site": string | null,"start_date": string | null,"status": string,"target_finish_date": string | null,"tender_id": string | null,"tower_count": number | null,"updated_at": string,"voltage_kv": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id": string,"code": string,"created_at"?: string,"created_by"?: string | null,"end_owner"?: string | null,"finish_date"?: string | null,"id"?: string,"length_kms"?: number | null,"location_id"?: string | null,"name": string,"notes"?: string | null,"site"?: string | null,"start_date"?: string | null,"status"?: string,"target_finish_date"?: string | null,"tender_id"?: string | null,"tower_count"?: number | null,"updated_at"?: string,"voltage_kv"?: number | null
                  }
                  Update: {
                    "client_id"?: string,"code"?: string,"created_at"?: string,"created_by"?: string | null,"end_owner"?: string | null,"finish_date"?: string | null,"id"?: string,"length_kms"?: number | null,"location_id"?: string | null,"name"?: string,"notes"?: string | null,"site"?: string | null,"start_date"?: string | null,"status"?: string,"target_finish_date"?: string | null,"tender_id"?: string | null,"tower_count"?: number | null,"updated_at"?: string,"voltage_kv"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "projects_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "client_tender_stats"
      referencedColumns: ["client_id"]
    },{
      foreignKeyName: "projects_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_location_id_fkey"
      columns: ["location_id"]
isOneToOne: true
      referencedRelation: "locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_tender_id_fkey"
      columns: ["tender_id"]
isOneToOne: true
      referencedRelation: "tenders"
      referencedColumns: ["id"]
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
                },"section_progress": {
                  Row: {
                    "progress": number,"section_id": string,"stage_id": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "progress": number,"section_id": string,"stage_id": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "progress"?: number,"section_id"?: string,"stage_id"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "section_progress_section_id_fkey"
      columns: ["section_id"]
isOneToOne: false
      referencedRelation: "project_sections"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "section_progress_section_id_fkey"
      columns: ["section_id"]
isOneToOne: false
      referencedRelation: "section_progress_summary"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "section_progress_stage_id_fkey"
      columns: ["stage_id"]
isOneToOne: false
      referencedRelation: "project_stages"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "section_progress_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
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
                },"supplier_bill_lines": {
                  Row: {
                    "amount": number,"bill_id": string,"cost_category_id": string,"description": string,"id": string,"project_id": string | null,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"bill_id": string,"cost_category_id": string,"description": string,"id"?: string,"project_id"?: string | null,"sort_order"?: number
                  }
                  Update: {
                    "amount"?: number,"bill_id"?: string,"cost_category_id"?: string,"description"?: string,"id"?: string,"project_id"?: string | null,"sort_order"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "supplier_bill_lines_bill_id_fkey"
      columns: ["bill_id"]
isOneToOne: false
      referencedRelation: "supplier_bill_list"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "supplier_bill_lines_bill_id_fkey"
      columns: ["bill_id"]
isOneToOne: false
      referencedRelation: "supplier_bills"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "supplier_bill_lines_cost_category_id_fkey"
      columns: ["cost_category_id"]
isOneToOne: false
      referencedRelation: "cost_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "supplier_bill_lines_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "supplier_bill_lines_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "supplier_bill_lines_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "supplier_bill_lines_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "supplier_bill_lines_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "supplier_bill_lines_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "supplier_bill_lines_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "supplier_bill_lines_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"supplier_bills": {
                  Row: {
                    "bill_date": string,"bill_no": string,"cancel_reason": string | null,"cancelled_at": string | null,"created_at": string,"created_by": string | null,"delivery_note_id": string | null,"due_date": string,"id": string,"is_opening": boolean,"notes": string | null,"ppn_amount": number,"ppn_is_cost": boolean,"status": string,"subtotal": number,"supplier_id": string,"total": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bill_date": string,"bill_no": string,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"delivery_note_id"?: string | null,"due_date": string,"id"?: string,"is_opening"?: boolean,"notes"?: string | null,"ppn_amount"?: number,"ppn_is_cost"?: boolean,"status"?: string,"subtotal"?: number,"supplier_id": string,"total"?: number,"updated_at"?: string
                  }
                  Update: {
                    "bill_date"?: string,"bill_no"?: string,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"delivery_note_id"?: string | null,"due_date"?: string,"id"?: string,"is_opening"?: boolean,"notes"?: string | null,"ppn_amount"?: number,"ppn_is_cost"?: boolean,"status"?: string,"subtotal"?: number,"supplier_id"?: string,"total"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "supplier_bills_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "supplier_bills_delivery_note_id_fkey"
      columns: ["delivery_note_id"]
isOneToOne: false
      referencedRelation: "delivery_notes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "supplier_bills_supplier_id_fkey"
      columns: ["supplier_id"]
isOneToOne: false
      referencedRelation: "suppliers"
      referencedColumns: ["id"]
    }
                  ]
                },"supplier_payments": {
                  Row: {
                    "amount": number,"bank_account_id": string | null,"bill_id": string,"cancel_reason": string | null,"cancelled_at": string | null,"created_at": string,"created_by": string | null,"id": string,"is_opening": boolean,"method": string,"notes": string | null,"payment_date": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"bank_account_id"?: string | null,"bill_id": string,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"is_opening"?: boolean,"method"?: string,"notes"?: string | null,"payment_date": string,"status"?: string
                  }
                  Update: {
                    "amount"?: number,"bank_account_id"?: string | null,"bill_id"?: string,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"is_opening"?: boolean,"method"?: string,"notes"?: string | null,"payment_date"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "supplier_payments_bank_account_id_fkey"
      columns: ["bank_account_id"]
isOneToOne: false
      referencedRelation: "company_bank_accounts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "supplier_payments_bill_id_fkey"
      columns: ["bill_id"]
isOneToOne: false
      referencedRelation: "supplier_bill_list"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "supplier_payments_bill_id_fkey"
      columns: ["bill_id"]
isOneToOne: false
      referencedRelation: "supplier_bills"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "supplier_payments_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
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
                },"tool_movements": {
                  Row: {
                    "created_at": string,"created_by": string | null,"delivery_note_id": string | null,"from_condition": string | null,"from_location_id": string | null,"id": number,"kind": string,"note": string | null,"quantity": number,"to_condition": string | null,"to_location_id": string | null,"tool_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"delivery_note_id"?: string | null,"from_condition"?: string | null,"from_location_id"?: string | null,"id"?: never,"kind": string,"note"?: string | null,"quantity": number,"to_condition"?: string | null,"to_location_id"?: string | null,"tool_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"delivery_note_id"?: string | null,"from_condition"?: string | null,"from_location_id"?: string | null,"id"?: never,"kind"?: string,"note"?: string | null,"quantity"?: number,"to_condition"?: string | null,"to_location_id"?: string | null,"tool_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tool_movements_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tool_movements_delivery_note_id_fkey"
      columns: ["delivery_note_id"]
isOneToOne: false
      referencedRelation: "delivery_notes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tool_movements_from_location_id_fkey"
      columns: ["from_location_id"]
isOneToOne: false
      referencedRelation: "locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tool_movements_to_location_id_fkey"
      columns: ["to_location_id"]
isOneToOne: false
      referencedRelation: "locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tool_movements_tool_id_fkey"
      columns: ["tool_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["tool_id"]
    },{
      foreignKeyName: "tool_movements_tool_id_fkey"
      columns: ["tool_id"]
isOneToOne: false
      referencedRelation: "tool_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tool_movements_tool_id_fkey"
      columns: ["tool_id"]
isOneToOne: false
      referencedRelation: "tools"
      referencedColumns: ["id"]
    }
                  ]
                },"tool_stock": {
                  Row: {
                    "condition": string,"location_id": string,"quantity": number,"tool_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "condition": string,"location_id": string,"quantity": number,"tool_id": string
                  }
                  Update: {
                    "condition"?: string,"location_id"?: string,"quantity"?: number,"tool_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tool_stock_location_id_fkey"
      columns: ["location_id"]
isOneToOne: false
      referencedRelation: "locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tool_stock_tool_id_fkey"
      columns: ["tool_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["tool_id"]
    },{
      foreignKeyName: "tool_stock_tool_id_fkey"
      columns: ["tool_id"]
isOneToOne: false
      referencedRelation: "tool_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tool_stock_tool_id_fkey"
      columns: ["tool_id"]
isOneToOne: false
      referencedRelation: "tools"
      referencedColumns: ["id"]
    }
                  ]
                },"tools": {
                  Row: {
                    "category_id": string,"code": string,"created_at": string,"id": string,"is_active": boolean,"name": string,"notes": string | null,"ownership": string,"rental_period": string | null,"rental_rate": number | null,"serial_no": string | null,"supplier_id": string | null,"tracking": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": string,"code": string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"name": string,"notes"?: string | null,"ownership"?: string,"rental_period"?: string | null,"rental_rate"?: number | null,"serial_no"?: string | null,"supplier_id"?: string | null,"tracking": string,"updated_at"?: string
                  }
                  Update: {
                    "category_id"?: string,"code"?: string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"name"?: string,"notes"?: string | null,"ownership"?: string,"rental_period"?: string | null,"rental_rate"?: number | null,"serial_no"?: string | null,"supplier_id"?: string | null,"tracking"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tools_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "item_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tools_supplier_id_fkey"
      columns: ["supplier_id"]
isOneToOne: false
      referencedRelation: "suppliers"
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
            "active_rentals": {
                  Row: {
                    "arrived_at": string | null,"code": string,"days": number | null,"estimated_cost": number | null,"name": string,"project_code": string,"project_id": string,"quantity": number | null,"rental_period": string | null,"rental_rate": number | null,"supplier_name": string,"tool_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"assignment_list": {
                  Row: {
                    "cert_issues": string | null,"cert_state": string | null,"created_at": string,"employee_active": boolean | null,"employee_id": string,"employee_name": string,"employee_no": string,"end_date": string | null,"id": string,"notes": string | null,"overridden_at": string | null,"overridden_by": string | null,"override_reason": string | null,"position_id": string,"position_name": string,"project_code": string,"project_id": string,"project_name": string,"project_status": string,"start_date": string,"state": string | null,"verification_status": string,"work_type": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "assignments_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "employees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignments_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "training_needs"
      referencedColumns: ["employee_id"]
    },{
      foreignKeyName: "assignments_overridden_by_fkey"
      columns: ["overridden_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignments_position_id_fkey"
      columns: ["position_id"]
isOneToOne: false
      referencedRelation: "positions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignments_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "assignments_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "assignments_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "assignments_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "assignments_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "assignments_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "assignments_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignments_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"client_tender_stats": {
                  Row: {
                    "client_id": string,"lost_count": number | null,"lost_value": number | null,"tender_count": number | null,"win_rate_count": number | null,"win_rate_value": number | null,"won_count": number | null,"won_value": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"cost_entries": {
                  Row: {
                    "amount": number | null,"cost_category_id": string | null,"description": string | null,"entry_date": string | null,"project_id": string | null,"reference": string | null,"source": string | null,"source_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"daily_report_list": {
                  Row: {
                    "activity_count": number | null,"briefing_participants": number | null,"effective_hours": number | null,"equipment_used": string | null,"id": string,"no_activity": boolean,"no_activity_reason": string | null,"notes": string | null,"obstacle_count": number | null,"photo_count": number | null,"plan_tomorrow": string | null,"project_code": string,"project_id": string,"project_name": string,"report_date": string,"review_comment": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"safety_briefing": boolean,"status": string,"submitted_at": string | null,"submitted_by": string | null,"weather_afternoon": string | null,"weather_midday": string | null,"weather_morning": string | null,"workforce": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "daily_reports_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "daily_reports_submitted_by_fkey"
      columns: ["submitted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"daily_report_obstacle_summary": {
                  Row: {
                    "category": string,"last_date": string | null,"obstacle_count": number | null,"project_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "daily_reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
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
                },"field_cash_balances": {
                  Row: {
                    "approved": number | null,"balance": number | null,"pending": number | null,"pending_count": number | null,"project_code": string,"project_id": string,"project_name": string,"project_status": string,"returns": number | null,"topups": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"field_cash_ledger": {
                  Row: {
                    "amount": number | null,"category_name": string | null,"cost_category_id": string | null,"created_at": string | null,"created_by": string | null,"description": string | null,"employee_id": string | null,"employee_name": string | null,"entry_date": string | null,"id": string | null,"kind": string | null,"no_receipt": boolean | null,"project_id": string | null,"reject_reason": string | null,"status": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"incident_list": {
                  Row: {
                    "action_count": number | null,"body_parts": string | null,"cancel_reason": string | null,"cancelled_at": string | null,"chronology": string,"classification": string,"closed_at": string | null,"closed_by": string | null,"created_at": string,"direct_cause": string | null,"id": string,"immediate_action": string | null,"investigated_at": string | null,"investigated_by": string | null,"location_note": string | null,"lost_days": number,"number": string,"occurred_at": string,"occurred_on": string | null,"open_actions": number | null,"overdue_actions": number | null,"project_code": string,"project_id": string,"project_name": string,"reported_by": string | null,"root_cause": string | null,"section_code": string | null,"section_id": string | null,"status": string,"witnesses": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "incidents_closed_by_fkey"
      columns: ["closed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "incidents_investigated_by_fkey"
      columns: ["investigated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "incidents_reported_by_fkey"
      columns: ["reported_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "incidents_section_id_fkey"
      columns: ["section_id"]
isOneToOne: false
      referencedRelation: "project_sections"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "incidents_section_id_fkey"
      columns: ["section_id"]
isOneToOne: false
      referencedRelation: "section_progress_summary"
      referencedColumns: ["id"]
    }
                  ]
                },"incident_monthly": {
                  Row: {
                    "classification": string,"count": number | null,"month": string | null,"project_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "incidents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"invoice_list": {
                  Row: {
                    "aging_bucket": string | null,"balance": number | null,"cancel_reason": string | null,"client_id": string,"client_name": string | null,"created_at": string,"days_overdue": number | null,"description": string,"dp_deduction": number,"dpp": number,"due_date": string,"gross_amount": number,"id": string,"invoice_date": string,"issued_at": string | null,"kind": string,"notes": string | null,"number": string | null,"other_deduction": number,"other_deduction_note": string | null,"pph": number | null,"ppn_amount": number,"ppn_rate": number,"project_code": string,"project_id": string,"project_name": string,"received": number | null,"retention_deduction": number,"status": string,"term_id": string | null,"term_name": string | null,"total": number
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_term_id_fkey"
      columns: ["term_id"]
isOneToOne: false
      referencedRelation: "project_term_list"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_term_id_fkey"
      columns: ["term_id"]
isOneToOne: false
      referencedRelation: "project_terms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "client_tender_stats"
      referencedColumns: ["client_id"]
    },{
      foreignKeyName: "projects_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    }
                  ]
                },"kasbon_balances": {
                  Row: {
                    "amount": number,"balance": number | null,"cancel_reason": string | null,"created_at": string,"deducted": number | null,"description": string | null,"employee_id": string,"employee_no": string,"field_cash_expense_id": string | null,"full_name": string,"id": string,"installment_amount": number,"kasbon_date": string,"source": string,"status": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "kasbons_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "employees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "kasbons_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "training_needs"
      referencedColumns: ["employee_id"]
    },{
      foreignKeyName: "kasbons_field_cash_expense_id_fkey"
      columns: ["field_cash_expense_id"]
isOneToOne: true
      referencedRelation: "field_cash_expenses"
      referencedColumns: ["id"]
    }
                  ]
                },"material_low_stock": {
                  Row: {
                    "code": string,"location_code": string,"location_id": string,"location_name": string,"material_id": string,"min_stock": number | null,"name": string,"quantity": number,"unit_code": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "material_stock_location_id_fkey"
      columns: ["location_id"]
isOneToOne: false
      referencedRelation: "locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "material_stock_material_id_fkey"
      columns: ["material_id"]
isOneToOne: false
      referencedRelation: "material_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "material_stock_material_id_fkey"
      columns: ["material_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["material_id"]
    },{
      foreignKeyName: "material_stock_material_id_fkey"
      columns: ["material_id"]
isOneToOne: false
      referencedRelation: "materials"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "materials_unit_code_fkey"
      columns: ["unit_code"]
isOneToOne: false
      referencedRelation: "units"
      referencedColumns: ["code"]
    }
                  ]
                },"material_overview": {
                  Row: {
                    "category_id": string,"category_name": string,"code": string,"id": string,"in_transit": number | null,"is_active": boolean,"low_locations": number | null,"min_stock": number | null,"name": string,"notes": string | null,"on_hand": number | null,"ownership": string,"total": number | null,"unit_code": string,"unit_name": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "materials_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "item_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "materials_unit_code_fkey"
      columns: ["unit_code"]
isOneToOne: false
      referencedRelation: "units"
      referencedColumns: ["code"]
    }
                  ]
                },"material_reconciliation": {
                  Row: {
                    "material_code": string,"material_id": string,"material_name": string,"on_hand": number | null,"project_code": string,"project_id": string,"project_name": string,"received": number | null,"returned": number | null,"shrinkage": number | null,"transferred_in": number | null,"transferred_out": number | null,"unit_code": string,"used": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "materials_unit_code_fkey"
      columns: ["unit_code"]
isOneToOne: false
      referencedRelation: "units"
      referencedColumns: ["code"]
    }
                  ]
                },"missing_daily_reports": {
                  Row: {
                    "code": string,"name": string,"project_id": string,"report_date": string | null
                  }
                  ComputedFields: never
                  Insert: {
                           "code"?: string | null,"name"?: string | null,"project_id"?: string | null,"report_date"?: never
                         }
                        Update: {
                           "code"?: string | null,"name"?: string | null,"project_id"?: string | null,"report_date"?: never
                         }
                        Relationships: [
                    
                  ]
                },"payable_aging": {
                  Row: {
                    "current_amount": number | null,"d1_30": number | null,"d31_60": number | null,"d61_90": number | null,"d90_plus": number | null,"supplier_id": string,"supplier_name": string,"total_balance": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "supplier_bills_supplier_id_fkey"
      columns: ["supplier_id"]
isOneToOne: false
      referencedRelation: "suppliers"
      referencedColumns: ["id"]
    }
                  ]
                },"payroll_cost_entries": {
                  Row: {
                    "amount": number,"cost_category_id": string | null,"description": string | null,"entry_date": string,"paid": boolean | null,"project_id": string | null,"reference": string | null,"source": string | null,"source_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"payroll_period_list": {
                  Row: {
                    "approved_at": string | null,"flagged": number | null,"generated_at": string | null,"gross_total": number | null,"group_kind": string,"id": string,"name": string,"net_total": number | null,"notes": string | null,"paid_at": string | null,"period_end": string,"period_start": string,"return_note": string | null,"slip_count": number | null,"status": string
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"payroll_recap": {
                  Row: {
                    "allocated": number | null,"days": number | null,"employees": number | null,"period_id": string,"project_code": string | null,"project_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payroll_allocations_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payslips_period_id_fkey"
      columns: ["period_id"]
isOneToOne: false
      referencedRelation: "payroll_period_list"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payslips_period_id_fkey"
      columns: ["period_id"]
isOneToOne: false
      referencedRelation: "payroll_periods"
      referencedColumns: ["id"]
    }
                  ]
                },"payslip_list": {
                  Row: {
                    "absence_deduction": number,"absent_days": number,"active_days": number,"bank_account_holder": string | null,"bank_account_number": string | null,"bank_name": string | null,"base_amount": number,"base_salary": number,"bpjs_deduction": number,"correction_amount": number,"created_at": string,"daily_wage": number,"employee_id": string,"employee_no": string,"field_amount": number,"field_rate": number,"fixed_allowance": number,"full_name": string,"gross": number,"id": string,"incentive_amount": number,"incomplete_attendance": boolean,"kasbon_deduction": number,"main_project_id": string | null,"meal_amount": number,"meal_rate": number,"net": number,"other_deduction": number,"overtime_amount": number,"overtime_hours": number,"overtime_rate": number,"paid_at": string | null,"pay_type": string,"payment_method": string | null,"period_days": number,"period_id": string,"position_name": string | null,"pph21_deduction": number,"present_days": number,"project_days": number,"projects": string | null,"range_end": string,"range_start": string,"recorded_days": number,"status": string,"total_deductions": number,"unverified": boolean,"wage_amount": number,"work_type": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "payslips_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "employees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payslips_employee_id_fkey"
      columns: ["employee_id"]
isOneToOne: false
      referencedRelation: "training_needs"
      referencedColumns: ["employee_id"]
    },{
      foreignKeyName: "payslips_period_id_fkey"
      columns: ["period_id"]
isOneToOne: false
      referencedRelation: "payroll_period_list"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payslips_period_id_fkey"
      columns: ["period_id"]
isOneToOne: false
      referencedRelation: "payroll_periods"
      referencedColumns: ["id"]
    }
                  ]
                },"project_budget_summary": {
                  Row: {
                    "contract_value": number | null,"planned_profit": number | null,"project_id": string,"total_budget": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"project_category_costs": {
                  Row: {
                    "amount": number | null,"cost_category_id": string | null,"project_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"project_cost_by_category": {
                  Row: {
                    "actual": number | null,"budget": number | null,"category_code": string,"category_name": string,"cost_category_id": string | null,"final_estimate": number | null,"project_id": string | null,"remaining": number | null,"sort_order": number,"used_pct": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"project_financials": {
                  Row: {
                    "billed_total": number | null,"cash_in": number | null,"cash_out": number | null,"cash_position": number | null,"client_name": string | null,"code": string,"contract_value": number | null,"cost": number | null,"cost_index": number | null,"cost_used_pct": number | null,"expenses_paid": number | null,"field_cash_balance": number | null,"final_cost": number | null,"gross_profit": number | null,"health": string | null,"margin": number | null,"name": string,"net_topups": number | null,"payroll_paid": number | null,"planned_profit": number | null,"planned_progress": number | null,"progress": number | null,"project_id": string,"projected_profit": number | null,"received_total": number | null,"revenue": number | null,"schedule_deviation": number | null,"start_date": string | null,"status": string,"supplier_paid": number | null,"total_budget": number | null,"unbilled": number | null,"work_done": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"project_overview": {
                  Row: {
                    "addendum_count": number | null,"base_contract_value": number | null,"client_id": string,"client_name": string | null,"code": string,"contract_date": string | null,"contract_no": string | null,"contract_value": number | null,"created_at": string,"end_owner": string | null,"finish_date": string | null,"id": string,"length_kms": number | null,"location_id": string | null,"maintenance_months": number | null,"name": string,"notes": string | null,"planned_progress": number | null,"ppn_applicable": boolean | null,"progress": number | null,"scope": string | null,"site": string | null,"start_date": string | null,"status": string,"target_finish_date": string | null,"tender_id": string | null,"tower_count": number | null,"voltage_kv": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "projects_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "client_tender_stats"
      referencedColumns: ["client_id"]
    },{
      foreignKeyName: "projects_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_location_id_fkey"
      columns: ["location_id"]
isOneToOne: true
      referencedRelation: "locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_tender_id_fkey"
      columns: ["tender_id"]
isOneToOne: true
      referencedRelation: "tenders"
      referencedColumns: ["id"]
    }
                  ]
                },"project_progress": {
                  Row: {
                    "deviation": number | null,"planned_progress": number | null,"progress": number | null,"project_id": string,"section_count": number | null,"total_kms": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"project_term_list": {
                  Row: {
                    "amount": number | null,"amount_value": number | null,"condition_date": string | null,"condition_progress": number | null,"condition_type": string,"created_at": string,"id": string,"kind": string,"name": string,"notes": string | null,"percent": number | null,"project_id": string,"ready_at": string | null,"ready_by": string | null,"sort_order": number,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "project_terms_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_terms_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_terms_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_terms_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_terms_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_terms_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_terms_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_terms_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_terms_ready_by_fkey"
      columns: ["ready_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"receivable_aging": {
                  Row: {
                    "client_id": string,"client_name": string | null,"current_amount": number | null,"d1_30": number | null,"d31_60": number | null,"d61_90": number | null,"d90_plus": number | null,"project_code": string,"project_id": string,"project_name": string,"total_balance": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "client_tender_stats"
      referencedColumns: ["client_id"]
    },{
      foreignKeyName: "projects_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    }
                  ]
                },"section_progress_summary": {
                  Row: {
                    "circuits": number,"code": string,"id": string,"kms": number | null,"length_km": number,"notes": string | null,"planned_finish": string,"planned_progress": number | null,"planned_start": string,"progress": number | null,"project_id": string,"sort_order": number,"state": string | null,"tower_count": number | null,"tower_from": string,"tower_to": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "field_cash_balances"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "material_reconciliation"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "missing_daily_reports"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_budget_summary"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_financials"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_sections_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"supplier_bill_list": {
                  Row: {
                    "aging_bucket": string | null,"balance": number | null,"bill_date": string,"bill_no": string,"cancel_reason": string | null,"created_at": string,"days_overdue": number | null,"delivery_note_id": string | null,"delivery_note_number": string | null,"due_date": string,"due_group": string | null,"id": string,"is_opening": boolean,"notes": string | null,"paid": number | null,"ppn_amount": number,"projects": string | null,"status": string,"subtotal": number,"supplier_id": string,"supplier_name": string,"total": number
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "supplier_bills_delivery_note_id_fkey"
      columns: ["delivery_note_id"]
isOneToOne: false
      referencedRelation: "delivery_notes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "supplier_bills_supplier_id_fkey"
      columns: ["supplier_id"]
isOneToOne: false
      referencedRelation: "suppliers"
      referencedColumns: ["id"]
    }
                  ]
                },"tool_overview": {
                  Row: {
                    "category_id": string,"category_name": string,"code": string,"damaged": number | null,"good": number | null,"id": string,"in_transit": number | null,"is_active": boolean,"lost": number | null,"name": string,"notes": string | null,"ownership": string,"rental_period": string | null,"rental_rate": number | null,"repair": number | null,"serial_no": string | null,"supplier_id": string | null,"supplier_name": string | null,"total": number | null,"tracking": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "tools_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "item_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tools_supplier_id_fkey"
      columns: ["supplier_id"]
isOneToOne: false
      referencedRelation: "suppliers"
      referencedColumns: ["id"]
    }
                  ]
                },"tool_stays": {
                  Row: {
                    "days": number | null,"end_at": string | null,"location_id": string | null,"location_name": string,"location_type": string,"start_at": string,"tool_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "tool_movements_to_location_id_fkey"
      columns: ["location_id"]
isOneToOne: false
      referencedRelation: "locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tool_movements_tool_id_fkey"
      columns: ["tool_id"]
isOneToOne: false
      referencedRelation: "active_rentals"
      referencedColumns: ["tool_id"]
    },{
      foreignKeyName: "tool_movements_tool_id_fkey"
      columns: ["tool_id"]
isOneToOne: false
      referencedRelation: "tool_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tool_movements_tool_id_fkey"
      columns: ["tool_id"]
isOneToOne: false
      referencedRelation: "tools"
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
            "adjust_tool_stock":
{ Args: { "p_condition": string,"p_delta": number,"p_location": string,"p_reason": string,"p_tool": string }; Returns: undefined
                           },
"apply_stage_progress":
{ Args: { "p_by": string,"p_note": string,"p_progress": number,"p_report": string,"p_section": string,"p_source": string,"p_stage": string }; Returns: boolean
                           },
"approve_payroll":
{ Args: { "p_period": string }; Returns: undefined
                           },
"assignment_fitness":
{ Args: { "p_employee": string,"p_on"?: string,"p_position": string }; Returns: {
              "certificate_type_id": string,"certificate_type_name": string,"expiry_date": string,"status": string
            }[]
                           },
"attachment_bucket":
{ Args: { "p_entity_type": string }; Returns: string
                           },
"attachment_read_attendance_day":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_read_daily_report":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_read_delivery_note":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_read_employee":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_read_employee_certificate":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_read_expense":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_read_field_cash_expense":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_read_field_cash_movement":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_read_incident":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_read_incident_action":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_read_invoice":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_read_invoice_payment":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_read_material_transaction":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_read_project":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_read_supplier_bill":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_read_supplier_payment":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_read_tender":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_read_tool":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_write_attendance_day":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_write_daily_report":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_write_delivery_note":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_write_employee":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_write_employee_certificate":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_write_expense":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_write_field_cash_expense":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_write_field_cash_movement":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_write_incident":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_write_incident_action":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_write_invoice":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_write_invoice_payment":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_write_material_transaction":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_write_project":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_write_supplier_bill":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_write_supplier_payment":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_write_tender":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attachment_write_tool":
{ Args: { "p_category": string,"p_id": string }; Returns: boolean
                           },
"attendance_recap":
{ Args: { "p_from": string,"p_to": string }; Returns: {
              "absent": number,"employee_id": string,"leave": number,"off": number,"overtime_hours": number,"permit": number,"present": number,"project_id": string,"sick": number
            }[]
                           },
"backdate_days":
{ Args: Record<PropertyKey, never>; Returns: number
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
"cancel_delivery_note":
{ Args: { "p_note": string,"p_reason": string }; Returns: undefined
                           },
"cancel_expense":
{ Args: { "p_id": string,"p_reason": string }; Returns: undefined
                           },
"cancel_field_cash_expense":
{ Args: { "p_id": string,"p_reason": string }; Returns: undefined
                           },
"cancel_field_cash_movement":
{ Args: { "p_id": string,"p_reason": string }; Returns: undefined
                           },
"cancel_incident":
{ Args: { "p_id": string,"p_reason": string }; Returns: undefined
                           },
"cancel_invoice":
{ Args: { "p_id": string,"p_reason": string }; Returns: undefined
                           },
"cancel_invoice_payment":
{ Args: { "p_payment": string,"p_reason": string }; Returns: undefined
                           },
"cancel_kasbon":
{ Args: { "p_id": string,"p_reason": string }; Returns: undefined
                           },
"cancel_material_transaction":
{ Args: { "p_reason": string,"p_txn": string }; Returns: undefined
                           },
"cancel_payroll_period":
{ Args: { "p_period": string,"p_reason": string }; Returns: undefined
                           },
"cancel_supplier_bill":
{ Args: { "p_bill": string,"p_reason": string }; Returns: undefined
                           },
"cancel_supplier_payment":
{ Args: { "p_payment": string,"p_reason": string }; Returns: undefined
                           },
"certificate_status":
{ Args: { "p_expiry": string,"p_on"?: string }; Returns: string
                           },
"change_tool_condition":
{ Args: { "p_from": string,"p_location": string,"p_note": string,"p_quantity": number,"p_to": string,"p_tool": string }; Returns: undefined
                           },
"check_certificate_expiry":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"check_client_followups":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"check_material_min_stock":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"check_missing_daily_reports":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"check_payables":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"check_progress_terms":
{ Args: { "p_project": string }; Returns: undefined
                           },
"check_receivables":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"check_tender_deadlines":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"check_term_dates":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"close_incident":
{ Args: { "p_id": string }; Returns: undefined
                           },
"close_project":
{ Args: { "p_note"?: string,"p_project": string }; Returns: undefined
                           },
"company_monthly_summary":
{ Args: { "p_year": number }; Returns: {
              "cash_in": number,"cash_out": number,"month": string,"overhead": number,"profit": number,"project_cost": number,"revenue": number
            }[]
                           },
"complete_incident_action":
{ Args: { "p_id": string,"p_note": string }; Returns: undefined
                           },
"correct_attendance":
{ Args: { "p_date": string,"p_employee": string,"p_overtime": number,"p_reason": string,"p_status": string }; Returns: undefined
                           },
"create_material":
{ Args: { "p_location"?: string,"p_material": Json,"p_quantity"?: number }; Returns: string
                           },
"create_payroll_period":
{ Args: { "p_values": Json }; Returns: string
                           },
"create_project":
{ Args: { "p_contract": Json,"p_project": Json }; Returns: string
                           },
"create_tool":
{ Args: { "p_condition": string,"p_location": string,"p_quantity": number,"p_tool": Json }; Returns: string
                           },
"current_app_role":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["app_role"]
                           },
"current_employee_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"custom_access_token_hook":
{ Args: { "event": Json }; Returns: Json
                           },
"delete_payslip_adjustment":
{ Args: { "p_id": string }; Returns: undefined
                           },
"format_date_id":
{ Args: { "p_date": string }; Returns: string
                           },
"generate_payroll":
{ Args: { "p_period": string }; Returns: number
                           },
"has_role":
{ Args: { "roles": (Database["public"]['Enums']["app_role"])[] }; Returns: boolean
                           },
"import_opening_bill":
{ Args: { "p_values": Json }; Returns: string
                           },
"import_opening_invoice":
{ Args: { "p_values": Json }; Returns: string
                           },
"invoice_refresh":
{ Args: { "p_invoice": string }; Returns: undefined
                           },
"is_active_user":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_pay_table":
{ Args: { "p_table": string }; Returns: boolean
                           },
"issue_invoice":
{ Args: { "p_id": string }; Returns: string
                           },
"k3_stats":
{ Args: { "p_from": string,"p_to": string }; Returns: {
              "fatal": number,"first_aid": number,"last_lti_date": string,"lti": number,"lti_free_days": number,"ltifr": number,"medical": number,"near_miss": number,"open_actions": number,"overdue_actions": number,"project_code": string,"project_id": string,"project_name": string,"property": number,"total": number,"work_hours": number
            }[]
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
"mark_term_ready":
{ Args: { "p_term": string }; Returns: undefined
                           },
"material_post":
{ Args: { "p_delta": number,"p_kind": string,"p_location": string,"p_material": string,"p_note": string,"p_note_id": string,"p_quantity": number,"p_txn": string }; Returns: undefined
                           },
"material_qty_label":
{ Args: { "p_quantity": number }; Returns: string
                           },
"next_document_number":
{ Args: { "p_doc_date"?: string,"p_doc_type": string }; Returns: string
                           },
"notify_project_field":
{ Args: { "p_body": string,"p_category": string,"p_dedupe": string,"p_link": string,"p_project": string,"p_title": string }; Returns: undefined
                           },
"notify_roles":
{ Args: { "p_body"?: string,"p_category": string,"p_dedupe_key"?: string,"p_link"?: string,"p_roles": (Database["public"]['Enums']["app_role"])[],"p_title": string }; Returns: undefined
                           },
"notify_user":
{ Args: { "p_body"?: string,"p_category": string,"p_dedupe_key"?: string,"p_link"?: string,"p_recipient_id": string,"p_title": string }; Returns: undefined
                           },
"pay_payslips":
{ Args: { "p_date": string,"p_method": string,"p_period": string,"p_slips": (string)[] }; Returns: number
                           },
"project_close_checklist":
{ Args: { "p_project": string }; Returns: {
              "detail": string,"key": string,"label": string,"ok": boolean
            }[]
                           },
"project_finish_date":
{ Args: { "p_project": string,"p_target": string }; Returns: string
                           },
"project_progress_curve":
{ Args: { "p_project": string }; Returns: {
              "actual": number,"planned": number,"week_end": string
            }[]
                           },
"receive_delivery_note":
{ Args: { "p_lines": Json,"p_material_lines"?: Json,"p_note": string,"p_receipt_note": string }; Returns: undefined
                           },
"record_field_cash_expense":
{ Args: { "p_values": Json }; Returns: string
                           },
"record_field_cash_movement":
{ Args: { "p_values": Json }; Returns: string
                           },
"record_invoice_payment":
{ Args: { "p_invoice": string,"p_values": Json }; Returns: string
                           },
"record_material_transaction":
{ Args: { "p_lines": Json,"p_txn": Json }; Returns: string
                           },
"record_stock_opname":
{ Args: { "p_date": string,"p_lines": Json,"p_location": string,"p_reason": string }; Returns: string
                           },
"record_supplier_payment":
{ Args: { "p_bill": string,"p_values": Json }; Returns: string
                           },
"register_local_worker":
{ Args: { "p_project": string,"p_worker": Json }; Returns: string
                           },
"require_finance":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"require_payroll_role":
{ Args: { "p_roles": (Database["public"]['Enums']["app_role"])[] }; Returns: undefined
                           },
"return_payroll":
{ Args: { "p_note": string,"p_period": string }; Returns: undefined
                           },
"review_daily_report":
{ Args: { "p_action": string,"p_comment": string,"p_report": string }; Returns: undefined
                           },
"run_daily_checks":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"save_attendance":
{ Args: { "p_date": string,"p_project": string,"p_rows": Json }; Returns: number
                           },
"save_daily_report":
{ Args: { "p_activities": Json,"p_date": string,"p_obstacles": Json,"p_project": string,"p_report": Json }; Returns: string
                           },
"save_expense":
{ Args: { "p_id": string,"p_values": Json }; Returns: string
                           },
"save_incident":
{ Args: { "p_id": string,"p_incident": Json,"p_people": Json }; Returns: string
                           },
"save_incident_action":
{ Args: { "p_id": string,"p_incident": string,"p_values": Json }; Returns: string
                           },
"save_incident_investigation":
{ Args: { "p_id": string,"p_values": Json }; Returns: undefined
                           },
"save_invoice":
{ Args: { "p_id": string,"p_values": Json }; Returns: string
                           },
"save_kasbon":
{ Args: { "p_values": Json }; Returns: string
                           },
"save_payslip_adjustment":
{ Args: { "p_values": Json }; Returns: string
                           },
"save_project_stages":
{ Args: { "p_project": string,"p_stages": Json }; Returns: undefined
                           },
"save_stage_template":
{ Args: { "p_stages": Json }; Returns: undefined
                           },
"save_supplier_bill":
{ Args: { "p_bill": Json,"p_id": string,"p_lines": Json }; Returns: string
                           },
"section_planned_progress":
{ Args: { "p_finish": string,"p_on": string,"p_start": string }; Returns: number
                           },
"send_delivery_note":
{ Args: { "p_lines": Json,"p_material_lines"?: Json,"p_note": Json }; Returns: string
                           },
"set_default_bank_account":
{ Args: { "p_account_id": string }; Returns: undefined
                           },
"set_position_required_certificates":
{ Args: { "p_certificate_type_ids": (string)[],"p_position_id": string }; Returns: undefined
                           },
"set_project_status":
{ Args: { "p_project": string,"p_status": string }; Returns: undefined
                           },
"submit_payroll":
{ Args: { "p_period": string }; Returns: undefined
                           },
"supplier_bill_refresh":
{ Args: { "p_bill": string }; Returns: undefined
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
"term_set_ready":
{ Args: { "p_by": string,"p_term": string }; Returns: boolean
                           },
"today_wib":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"tool_condition_label":
{ Args: { "p_condition": string }; Returns: string
                           },
"tool_stock_change":
{ Args: { "p_condition": string,"p_delta": number,"p_location": string,"p_tool": string }; Returns: undefined
                           },
"update_section_progress":
{ Args: { "p_note": string,"p_progress": Json,"p_section": string }; Returns: number
                           },
"user_crew_ids":
{ Args: Record<PropertyKey, never>; Returns: string[]
                           },
"user_location_ids":
{ Args: Record<PropertyKey, never>; Returns: string[]
                           },
"user_project_ids":
{ Args: Record<PropertyKey, never>; Returns: string[]
                           },
"verify_field_cash_expense":
{ Args: { "p_approve": boolean,"p_id": string,"p_reason": string }; Returns: undefined
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
