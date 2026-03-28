import { useEffect, useState, useCallback, ChangeEvent } from 'react'
import { getUsers, disableUser, enableUser, AdminUser } from '../api/admin'
import axios from 'axios'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const PAGE_SIZE = 20

export default function Users() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Per-user action state: maps user id -> 'disabling' | 'enabling' | null
  const [actionState, setActionState] = useState<Record<string, string>>({})
  const [actionError, setActionError] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fetchUsers = useCallback(async (pg: number, q: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getUsers(pg, q)
      setUsers(data.users)
      setTotal(data.total)
    } catch (err) {
      if (axios.isAxiosError(err) && !err.response) {
        setError('Cannot reach the server. Check your network connection.')
      } else {
        setError('Failed to load users. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers(page, search)
  }, [page, search, fetchUsers])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  function handleSearchChange(e: ChangeEvent<HTMLInputElement>) {
    setSearchInput(e.target.value)
    if (e.target.value === '') {
      setPage(1)
      setSearch('')
    }
  }

  async function handleToggleUser(user: AdminUser) {
    const action = user.is_active ? 'disable' : 'enable'

    if (action === 'disable') {
      const confirmed = window.confirm(
        `Disable account for ${user.email}?\n\nThey will no longer be able to log in.`
      )
      if (!confirmed) return
    }

    setActionError(null)
    setActionState((s) => ({ ...s, [user.id]: action === 'disable' ? 'disabling' : 'enabling' }))

    try {
      if (action === 'disable') {
        await disableUser(user.id)
      } else {
        await enableUser(user.id)
      }
      // Optimistically update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_active: !u.is_active } : u
        )
      )
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail
        setActionError(
          typeof detail === 'string'
            ? detail
            : `Failed to ${action} user. Please try again.`
        )
      } else {
        setActionError(`Failed to ${action} user. Please try again.`)
      }
    } finally {
      setActionState((s) => ({ ...s, [user.id]: '' }))
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage app user accounts.
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="mb-5 flex gap-3 max-w-md">
        <input
          type="email"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search by email…"
          className="flex-1 px-3.5 py-2 border border-gray-300 rounded-lg text-sm
                     placeholder-gray-400 focus:outline-none focus:ring-2
                     focus:ring-brand-500 focus:border-brand-500 transition-colors"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm
                     font-semibold rounded-lg transition-colors focus:outline-none
                     focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          Search
        </button>
      </form>

      {/* Errors */}
      {error && (
        <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <ErrorIcon />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {actionError && (
        <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <ErrorIcon />
          <p className="text-sm text-red-700">{actionError}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            {search ? `No users found matching "${search}".` : 'No users yet.'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">
                      Email
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">
                      Role
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">
                      Joined
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => {
                    const busy = Boolean(actionState[user.id])
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 capitalize">
                          {user.role}
                        </td>
                        <td className="px-5 py-3.5">
                          {user.is_active ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                              Disabled
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">
                          {formatDate(user.joined_at)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleToggleUser(user)}
                            disabled={busy}
                            className={`
                              px-3 py-1.5 text-xs font-semibold rounded-md transition-colors
                              focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed
                              ${user.is_active
                                ? 'text-red-700 bg-red-50 hover:bg-red-100 focus:ring-red-400 disabled:opacity-50'
                                : 'text-green-700 bg-green-50 hover:bg-green-100 focus:ring-green-400 disabled:opacity-50'
                              }
                            `}
                          >
                            {busy
                              ? user.is_active
                                ? 'Disabling…'
                                : 'Enabling…'
                              : user.is_active
                              ? 'Disable'
                              : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
                <p className="text-gray-500">
                  Page {page} of {totalPages} &mdash; {total} users total
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700
                               hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed
                               transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700
                               hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed
                               transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ErrorIcon() {
  return (
    <svg
      className="w-5 h-5 text-red-500 mt-0.5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
      />
    </svg>
  )
}
