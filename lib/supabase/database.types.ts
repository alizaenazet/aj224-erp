
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
"assignment_fitness":
{ Args: { "p_employee": string,"p_on"?: string,"p_position": string }; Returns: {
              "certificate_type_id": string,"certificate_type_name": string,"expiry_date": string,"status": string
            }[]
                           },
"attachment_bucket":
{ Args: { "p_entity_type": string }; Returns: string
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
"check_missing_daily_reports":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"check_progress_terms":
{ Args: { "p_project": string }; Returns: undefined
                           },
"check_tender_deadlines":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"check_term_dates":
{ Args: Record<PropertyKey, never>; Returns: undefined
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
"mark_term_ready":
{ Args: { "p_term": string }; Returns: undefined
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
"project_finish_date":
{ Args: { "p_project": string,"p_target": string }; Returns: string
                           },
"project_progress_curve":
{ Args: { "p_project": string }; Returns: {
              "actual": number,"planned": number,"week_end": string
            }[]
                           },
"receive_delivery_note":
{ Args: { "p_lines": Json,"p_note": string,"p_receipt_note": string }; Returns: undefined
                           },
"register_local_worker":
{ Args: { "p_project": string,"p_worker": Json }; Returns: string
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
"save_project_stages":
{ Args: { "p_project": string,"p_stages": Json }; Returns: undefined
                           },
"save_stage_template":
{ Args: { "p_stages": Json }; Returns: undefined
                           },
"section_planned_progress":
{ Args: { "p_finish": string,"p_on": string,"p_start": string }; Returns: number
                           },
"send_delivery_note":
{ Args: { "p_lines": Json,"p_note": Json }; Returns: string
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
