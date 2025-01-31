import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import { CompanyQuickForm } from './company-quick-form'
import { useCompanies } from '@/features/companies/hooks/useCompanies'
import { useLocation } from '@/hooks/useLocation'
import { toast } from 'sonner'

// Mock dos hooks
vi.mock('@/hooks/useCompanies', () => ({
  useCompanies: vi.fn()
}))

vi.mock('@/hooks/useLocation', () => ({
  useLocation: vi.fn()
}))

// Mock do toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('CompanyQuickForm', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnSuccess = vi.fn()
  const mockCreateCompany = vi.fn()
  
  const mockStates = [
    { id: '1', name: 'São Paulo', uf: 'SP' },
    { id: '2', name: 'Rio de Janeiro', uf: 'RJ' }
  ]
  
  const mockCities = [
    { id: '1', name: 'São Paulo', state_id: '1' },
    { id: '2', name: 'Campinas', state_id: '1' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock para o Radix UI
    Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false)
    Element.prototype.scrollIntoView = vi.fn()
    
    // Mock padrão para o fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        logradouro: 'Rua Teste',
        bairro: 'Bairro Teste',
        localidade: 'São Paulo',
        uf: 'SP'
      })
    })
    
    vi.mocked(useCompanies).mockReturnValue({
      createCompany: {
        mutateAsync: mockCreateCompany
      },
      companies: [],
      isLoading: false
    } as any)

    vi.mocked(useLocation).mockReturnValue({
      states: mockStates,
      isLoadingStates: false,
      getCitiesByState: () => ({ data: mockCities, isLoading: false }),
      fetchCitiesByStateId: async () => mockCities
    } as any)
  })

  it('deve renderizar corretamente', () => {
    render(
      <CompanyQuickForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByText('Nova Empresa')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Nome da empresa')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('00.000.000/0000-00')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('00000-000')).toBeInTheDocument()
  })

  it('deve formatar CNPJ corretamente', async () => {
    const user = userEvent.setup()
    
    render(
      <CompanyQuickForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    const cnpjInput = screen.getByPlaceholderText('00.000.000/0000-00')
    await user.type(cnpjInput, '12345678901234')

    await waitFor(() => {
      expect(cnpjInput).toHaveValue('12.345.678/9012-34')
    })
  })

  it('deve formatar CEP corretamente', async () => {
    const user = userEvent.setup()
    
    render(
      <CompanyQuickForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    const cepInput = screen.getByPlaceholderText('00000-000')
    await user.type(cepInput, '12345678')

    await waitFor(() => {
      expect(cepInput).toHaveValue('12345-678')
    })
  })

  it('deve buscar endereço pelo CEP', async () => {
    const user = userEvent.setup()
    
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        logradouro: 'Rua Teste',
        bairro: 'Bairro Teste',
        localidade: 'São Paulo',
        uf: 'SP'
      })
    })

    render(
      <CompanyQuickForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    const cepInput = screen.getByPlaceholderText('00000-000')
    await user.type(cepInput, '12345678')
    await user.tab() // Move o foco para disparar o onBlur

    await waitFor(() => {
      expect(screen.getByDisplayValue('Rua Teste')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Bairro Teste')).toBeInTheDocument()
    })
  })

  it('deve criar empresa com sucesso', async () => {
    const user = userEvent.setup()
    
    const mockCompany = {
      id: '1',
      name: 'Empresa Teste',
      cnpj: '',
      cep: '12345-678',
      rua: 'Rua Teste',
      numero: '123',
      bairro: 'Bairro Teste',
      state_id: '1',
      city_id: '1'
    }

    mockCreateCompany.mockResolvedValueOnce(mockCompany)

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        logradouro: 'Rua Teste',
        bairro: 'Bairro Teste',
        localidade: 'São Paulo',
        uf: 'SP'
      })
    })

    render(
      <CompanyQuickForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    // Preenche o formulário
    await user.type(screen.getByPlaceholderText('Nome da empresa'), 'Empresa Teste')
    await user.type(screen.getByPlaceholderText('00000-000'), '12345678')
    await user.tab() // Dispara o onBlur do CEP

    // Aguarda o preenchimento automático do endereço
    await waitFor(() => {
      expect(screen.getByDisplayValue('Rua Teste')).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText('Número'), '123')

    // Seleciona estado
    const stateSelect = screen.getByRole('combobox', { name: /estado/i })
    await user.click(stateSelect)
    const stateOptions = screen.getAllByRole('option')
    const spState = stateOptions.find(option => option.textContent === 'São Paulo')
    await user.click(spState!)

    // Seleciona cidade
    const citySelect = screen.getByRole('combobox', { name: /cidade/i })
    await user.click(citySelect)
    const cityOptions = screen.getAllByRole('option')
    const spCity = cityOptions.find(option => option.textContent === 'São Paulo')
    await user.click(spCity!)

    // Submete o formulário
    const submitButton = screen.getByRole('button', { name: /criar nova empresa/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockCreateCompany).toHaveBeenCalledWith({
        name: 'Empresa Teste',
        cnpj: '',
        cep: '12345-678',
        rua: 'Rua Teste',
        numero: '123',
        complemento: '',
        bairro: 'Bairro Teste',
        state_id: '1',
        city_id: '1'
      })
      expect(mockOnSuccess).toHaveBeenCalledWith({
        id: mockCompany.id,
        name: mockCompany.name
      })
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      expect(toast.success).toHaveBeenCalledWith('Empresa criada com sucesso!')
    }, { timeout: 3000 })
  })

  it('deve mostrar erro quando a criação falha', async () => {
    const user = userEvent.setup()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    mockCreateCompany.mockRejectedValueOnce(new Error('Erro ao criar empresa'))

    // Mock específico para este teste
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        logradouro: 'Rua Teste',
        bairro: 'Bairro Teste',
        localidade: 'São Paulo',
        uf: 'SP'
      })
    })

    render(
      <CompanyQuickForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSuccess={mockOnSuccess}
      />
    )

    // Preenche dados mínimos
    await user.type(screen.getByPlaceholderText('Nome da empresa'), 'Empresa Teste')
    await user.type(screen.getByPlaceholderText('00000-000'), '12345678')
    await user.tab() // Dispara o onBlur do CEP

    // Aguarda o preenchimento automático do endereço
    await waitFor(() => {
      expect(screen.getByDisplayValue('Rua Teste')).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText('Número'), '123')

    // Seleciona estado
    const stateSelect = screen.getByRole('combobox', { name: /estado/i })
    await user.click(stateSelect)
    const stateOptions = screen.getAllByRole('option')
    const spState = stateOptions.find(option => option.textContent === 'São Paulo')
    await user.click(spState!)

    // Seleciona cidade
    const citySelect = screen.getByRole('combobox', { name: /cidade/i })
    await user.click(citySelect)
    const cityOptions = screen.getAllByRole('option')
    const spCity = cityOptions.find(option => option.textContent === 'São Paulo')
    await user.click(spCity!)

    // Submete o formulário
    const submitButton = screen.getByRole('button', { name: /criar nova empresa/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Ocorreu um erro ao criar a empresa. Tente novamente.')
      expect(mockOnOpenChange).not.toHaveBeenCalled()
    }, { timeout: 3000 })

    consoleSpy.mockRestore()
  })
}) 