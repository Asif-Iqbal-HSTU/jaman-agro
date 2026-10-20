<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Edit time limit
    |--------------------------------------------------------------------------
    |
    | Entries can be changed or deleted for this many days after they were
    | recorded. After that the manager has to ask the administrator to
    | unlock the entry. Administrators are never locked out.
    |
    */

    'edit_lock_days' => (int) env('EDIT_LOCK_DAYS', 3),

    // How long an approved unlock stays open.
    'unlock_valid_hours' => (int) env('UNLOCK_VALID_HOURS', 24),

];
