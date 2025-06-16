import { renderHook, act } from '@testing-library/react';
import { useCompanyForm } from './useCompanyForm';
import { supabase } from '@/lib/supabase';
import { vi } from 'vitest';

// Mock do supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
          then: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }
}));

// Mock do react-query
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn()
  })
}));

// Mock do toast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('useCompanyForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar com valores padrão', () => {
    const { result } = renderHook(() => useCompanyForm());
    
    expect(result.current.form.getValues()).toEqual({
      name: '',
      cnpj: '',
      state_id: '',
      city_id: '',
      address: ''
    });
  });

  it('deve inicializar com valores da empresa quando fornecida', () => {
    const company = {
      id: '1',
      name: 'Empresa Teste',
      cnpj: '12.345.678/0001-90',
      state_id: '1',
      city_id: '1',
      address: 'Rua Teste'
    };

    const { result } = renderHook(() => useCompanyForm(company));
    
    expect(result.current.form.getValues()).toEqual({
      name: company.name,
      cnpj: company.cnpj,
      state_id: company.state_id,
      city_id: company.city_id,
      address: company.address
    });
  });

  it('deve carregar estados ao inicializar', async () => {
    const states = [
      { id: '1', name: 'Estado 1' },
      { id: '2', name: 'Estado 2' }
    ];

    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: states, error: null }))
      }))
    }));

    const { result } = renderHook(() => useCompanyForm());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.states).toEqual(states);
    expect(result.current.loadingStates).toBe(false);
  });

  it('deve carregar cidades quando estado é selecionado', async () => {
    const cities = [
      { id: '1', name: 'Cidade 1' },
      { id: '2', name: 'Cidade 2' }
    ];

    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: cities, error: null }))
        }))
      }))
    }));

    const { result } = renderHook(() => useCompanyForm());

    await act(async () => {
      result.current.form.setValue('state_id', '1');
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.cities).toEqual(cities);
    expect(result.current.loadingCities).toBe(false);
  });

  it('deve submeter o formulário corretamente para nova empresa', async () => {
    const { result } = renderHook(() => useCompanyForm());
    const onSuccess = vi.fn();

    await act(async () => {
      result.current.form.setValue('name', 'Nova Empresa');
      result.current.form.setValue('cnpj', '12.345.678/0001-90');
      await result.current.onSubmit();
    });

    expect(supabase.from).toHaveBeenCalledWith('companies');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('deve submeter o formulário corretamente para atualização', async () => {
    const company = {
      id: '1',
      name: 'Empresa Existente',
      cnpj: '12.345.678/0001-90'
    };

    const { result } = renderHook(() => useCompanyForm(company));
    const onSuccess = vi.fn();

    await act(async () => {
      result.current.form.setValue('name', 'Empresa Atualizada');
      await result.current.onSubmit();
    });

    expect(supabase.from).toHaveBeenCalledWith('companies');
    expect(onSuccess).toHaveBeenCalled();
  });
});
