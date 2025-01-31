import { FunctionComponent } from "react";
import Component1 from "./Component1";
import Component2 from "./Component2";

export type Component3Type = {
  className?: string;

  /** Variant props */
  variant?: 1;
};

const Component3: FunctionComponent<Component3Type> = ({
  className = "",
  variant = 1,
}) => {
  return (
    <section
      className={`w-[1280px] flex flex-row items-center justify-center max-w-[1280px] min-h-[803px] text-left text-sm text-betaagendorcombr-mirage font-betaagendorcombr-semantic-button ${className}`}
      data-variant={variant}
    >
      <div className="flex-1 relative rounded-lg bg-betaagendorcombr-whisper h-[1119px]">
        <Component1 variant={2} />
        <div className="absolute top-[16px] left-[28px] rounded-lg w-16 h-16 overflow-hidden flex flex-col items-start justify-center">
          <div className="self-stretch flex-1 bg-betaagendorcombr-white flex flex-row items-center justify-center p-[22px]">
            <div className="w-5 relative h-5" />
          </div>
        </div>
        <div className="absolute h-[calc(100%_-_1095px)] top-[20px] bottom-[1075px] left-[104px] overflow-hidden flex flex-col items-start justify-start max-w-[512px] text-xl">
          <a className="[text-decoration:none] relative tracking-[-0.4px] leading-[24px] font-medium text-[inherit]">
            Nome do Usuário
          </a>
        </div>
        <nav className="m-0 absolute top-[calc(50%_-_503.5px)] left-[104px] flex flex-row items-center justify-start gap-line-height-21 text-left text-sm text-betaagendorcombr-blue-bell font-betaagendorcombr-semantic-button">
          <div className="flex flex-col items-start justify-start relative">
            <div className="relative leading-[21px] z-[0]">
              Adicionar categoria
            </div>
            <div className="w-[5.6px] h-[21px] absolute !m-[0] top-[0px] left-[-6.3px] leading-[21px] text-betaagendorcombr-mirage flex items-center z-[1]">
              •
            </div>
          </div>
          <div className="flex flex-col items-start justify-start relative">
            <div className="relative leading-[21px] z-[0]">
              Adicionar telefone
            </div>
            <div className="w-[5.6px] h-[21px] absolute !m-[0] top-[0px] left-[-12.3px] leading-[21px] text-betaagendorcombr-mirage flex items-center z-[1]">
              •
            </div>
          </div>
          <div className="flex flex-col items-start justify-start relative">
            <div className="relative leading-[21px] z-[0]">Adicionar email</div>
            <div className="w-[5.6px] h-[21px] absolute !m-[0] top-[0px] left-[-12.3px] leading-[21px] text-betaagendorcombr-mirage flex items-center z-[1]">
              •
            </div>
          </div>
          <div className="flex flex-row items-start justify-start relative gap-item-spacing-xxs text-betaagendorcombr-mirage">
            <div className="w-6 rounded-xl bg-betaagendorcombr-east-bay border-betaagendorcombr-white border-[2px] border-solid box-border h-6 overflow-hidden shrink-0 flex flex-row items-center justify-center py-[7px] px-[5.1px] z-[2] text-3xs text-betaagendorcombr-white">
              <a className="[text-decoration:none] relative leading-[10px] uppercase font-medium text-[inherit]">
                AB
              </a>
            </div>
            <div className="relative leading-[21px] z-[1]">Nome do usuário</div>
            <div className="h-[21px] w-[5.6px] absolute !m-[0] top-[1.5px] left-[-12.3px] leading-[21px] flex items-center z-[0]">
              •
            </div>
          </div>
        </nav>
        <button className="cursor-pointer border-betaagendorcombr-fog border-[2px] border-solid py-2 pl-3.5 pr-[26px] bg-betaagendorcombr-dodger-blue absolute top-[50px] left-[924.5px] rounded flex flex-row items-center justify-center gap-item-spacing-xs">
          <div className="w-4 relative h-4" />
          <div className="relative text-sm leading-[20px] font-medium font-betaagendorcombr-semantic-button text-transparent !bg-clip-text [background:linear-gradient(#fff,_#fff),_#fff] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] text-center">
            Adicionar negócio
          </div>
        </button>
        <button className="cursor-pointer border-betaagendorcombr-white border-[2px] border-solid py-[5px] px-3.5 bg-betaagendorcombr-white absolute top-[calc(50%_-_509.5px)] left-[1118px] rounded box-border w-[146px] h-9 flex flex-row items-center justify-center">
          <div className="relative text-sm leading-[20px] font-medium font-betaagendorcombr-semantic-button text-betaagendorcombr-black text-center">
            Mais opções
          </div>
        </button>
        <div className="absolute w-[calc(100%_-_1162.4px)] top-[106px] right-[1134.4px] left-[28px] bg-betaagendorcombr-snuff-50 border-betaagendorcombr-dodger-blue border-b-[2px] border-solid box-border flex flex-row items-center justify-start pt-4 px-4 pb-[18px] text-betaagendorcombr-dodger-blue">
          <div className="relative leading-[21px] font-medium">
            Ver histórico
          </div>
        </div>
        <a className="[text-decoration:none] absolute top-[122px] left-[161.6px] leading-[21px] font-medium text-[inherit] flex items-center">
          Ver negócios
        </a>
        <div className="absolute top-[122px] left-[280.2px] leading-[21px] font-medium flex items-center">
          Ver pessoas
        </div>
        <div className="absolute h-[calc(100%_-_162px)] w-[66.66%] top-[162px] right-[33.34%] bottom-[0px] left-[0%] rounded-t-none rounded-br-none rounded-bl-item-spacing-xs bg-betaagendorcombr-white text-center">
          <div className="absolute w-[calc(100%_-_64px)] top-[24px] right-[32px] left-[32px] rounded-lg bg-betaagendorcombr-whisper h-[156.8px] text-betaagendorcombr-east-bay">
            <div className="absolute w-[calc(100%_-_680.7px)] top-[8px] right-[676.7px] left-[4px] h-[34.8px]">
              <div className="absolute top-[calc(50%_-_8px)] left-[calc(50%_-_26.1px)] w-4 h-4" />
              <div className="absolute top-[calc(50%_-_9.4px)] left-[calc(50%_-_6.1px)] w-[32.1px] h-[16.8px] overflow-hidden">
                <div className="absolute top-[-0.9px] left-[calc(50%_-_16.05px)] leading-[16.8px] font-medium flex items-center justify-center">
                  Nota
                </div>
              </div>
            </div>
            <div className="absolute w-[calc(100%_-_669.5px)] top-[8px] right-[548.9px] left-[120.6px] h-[34.8px]">
              <div className="absolute top-[calc(50%_-_8px)] left-[calc(50%_-_31.7px)] w-4 h-4" />
              <div className="absolute top-[calc(50%_-_9.4px)] left-[calc(50%_-_11.7px)] w-[43.3px] h-[16.8px] overflow-hidden">
                <a className="[text-decoration:none] absolute top-[-0.9px] left-[calc(50%_-_21.65px)] leading-[16.8px] font-medium text-[inherit] flex items-center justify-center">
                  E-mail
                </a>
              </div>
            </div>
            <div className="absolute w-[calc(100%_-_660.1px)] top-[8px] right-[411.8px] left-[248.3px] h-[34.8px]">
              <div className="absolute top-[calc(50%_-_8px)] left-[calc(50%_-_36.4px)] w-4 h-4" />
              <div className="absolute top-[calc(50%_-_9.4px)] left-[calc(50%_-_16.4px)] w-[52.7px] h-[16.8px] overflow-hidden">
                <a className="[text-decoration:none] absolute top-[-0.9px] left-[calc(50%_-_26.35px)] leading-[16.8px] font-medium text-[inherit] flex items-center justify-center">
                  Ligação
                </a>
              </div>
            </div>
            <div className="absolute w-[calc(100%_-_651.3px)] top-[8px] right-[265.8px] left-[385.5px] h-[34.8px]">
              <div className="absolute top-[calc(50%_-_8px)] left-[calc(50%_-_40.8px)] w-4 h-4" />
              <div className="absolute top-[calc(50%_-_9.4px)] left-[calc(50%_-_20.8px)] w-[61.6px] h-[16.8px] overflow-hidden">
                <a className="[text-decoration:none] absolute top-[-0.9px] left-[calc(50%_-_30.8px)] leading-[16.8px] font-medium text-[inherit] flex items-center justify-center">
                  Proposta
                </a>
              </div>
            </div>
            <div className="absolute w-[calc(100%_-_658px)] top-[8px] right-[126.5px] left-[531.5px] h-[34.8px]">
              <div className="absolute top-[calc(50%_-_8px)] left-[calc(50%_-_37.45px)] w-4 h-4" />
              <div className="absolute top-[calc(50%_-_9.4px)] left-[calc(50%_-_17.45px)] w-[54.8px] h-[16.8px] overflow-hidden">
                <div className="absolute top-[-0.9px] left-[calc(50%_-_27.4px)] leading-[16.8px] font-medium flex items-center justify-center">
                  Reunião
                </div>
              </div>
            </div>
            <div className="absolute w-[calc(100%_-_674.7px)] top-[8px] right-[3.9px] left-[670.8px] h-[34.8px]">
              <div className="absolute top-[calc(50%_-_8px)] left-[calc(50%_-_29.1px)] w-4 h-4" />
              <div className="absolute top-[calc(50%_-_9.4px)] left-[calc(50%_-_9.1px)] w-[38.2px] h-[16.8px] overflow-hidden">
                <div className="absolute top-[-0.9px] left-[calc(50%_-_19.1px)] leading-[16.8px] font-medium flex items-center justify-center">
                  Visita
                </div>
              </div>
            </div>
            <div className="absolute w-full top-[50.8px] right-[0px] left-[0px] border-betaagendorcombr-snuff border-t-[1px] border-solid box-border h-px overflow-hidden opacity-[0.25]" />
            <div className="absolute w-[calc(100%_-_24px)] top-[63.8px] right-[12px] left-[12px] rounded bg-betaagendorcombr-white border-betaagendorcombr-whisper border-[1px] border-solid box-border h-[81px] overflow-auto flex flex-col items-start justify-start pt-[7px] pb-8 pl-3 pr-[501.5px] min-h-[62px] text-left text-betaagendorcombr-blue-bell">
              <div className="h-5 relative leading-[20px] flex items-center">
                O que foi feito e qual o próximo passo?
              </div>
            </div>
            <div className="absolute top-[calc(50%_+_30.4px)] left-[677.8px] rounded bg-betaagendorcombr-white border-betaagendorcombr-white border-[2px] border-solid flex flex-row items-center justify-center p-1.5">
              <div className="relative leading-[20px] font-medium">
                + Modelos
              </div>
            </div>
          </div>
          <div className="absolute top-[212.1px] left-[32px] text-base tracking-[-0.4px] leading-[19.2px] font-medium text-left flex items-center">
            Histórico de atividades
          </div>
          <div className="absolute top-[212.3px] left-[453.9px] leading-[21px] font-medium text-betaagendorcombr-east-bay text-left flex items-center">
            Mostrar atividades:
          </div>
          <div className="absolute w-[calc(100%_-_623.3px)] top-[204.8px] right-[32px] left-[591.3px] rounded bg-betaagendorcombr-whisper border-betaagendorcombr-whisper border-[1px] border-solid box-border overflow-auto flex flex-row items-center justify-between flex-wrap content-center py-[7.5px] px-[13px] min-h-[36px] max-h-[66px] text-left">
            <div className="flex-1 relative h-[21px] overflow-hidden z-[1]">
              <Component2 variant={2} text="da empresa, pessoas e ne…" />
            </div>
            <div className="w-5 relative h-5 z-[0]" />
          </div>
          <img
            className="absolute top-[calc(50%_-_197.7px)] left-[calc(50%_-_74.95px)] w-[150px] h-[118px] overflow-hidden object-cover"
            loading="lazy"
            alt=""
            src="/emptyactivitiesdbd6807cd4593067fb6b141b698b470dpng@2x.png"
          />
          <div className="absolute top-[398.7px] left-[calc(50%_-_110.75px)] text-base tracking-[-0.4px] leading-[19.2px] font-medium flex items-center justify-center">
            Nenhuma atividade registrada
          </div>
          <div className="absolute top-[426px] left-[calc(50%_-_178.75px)] leading-[21px] flex items-center justify-center">
            Que tal agendar uma ligação para evoluir este negócio?
          </div>
        </div>
        <div className="absolute w-[calc(100%_-_881.3px)] top-[162px] right-[16px] left-[865.3px] rounded-lg bg-betaagendorcombr-white h-[158px]">
          <div className="absolute top-[12px] left-[12px] leading-[21px] font-medium flex items-center">
            Ações
          </div>
          <div className="absolute w-full top-[45px] right-[0px] left-[0px] border-betaagendorcombr-snuff border-t-[1px] border-solid box-border h-px overflow-hidden opacity-[0.25]" />
          <div className="absolute w-[calc(100%_-_16px)] top-[46px] right-[16px] left-[0px] h-28 overflow-auto">
            <button className="cursor-pointer border-betaagendorcombr-dodger-blue border-[2px] border-solid py-2 pl-[27.4px] pr-[35.4px] bg-betaagendorcombr-dodger-blue absolute w-[calc(100%_-_207.4px)] top-[16px] right-[195.4px] left-[12px] rounded box-border flex flex-row items-center justify-center">
              <div className="relative text-sm leading-[20px] font-medium font-betaagendorcombr-semantic-button text-betaagendorcombr-white text-center">
                Enviar e-mail
              </div>
            </button>
            <button className="cursor-pointer border-betaagendorcombr-dodger-blue border-[2px] border-solid py-2 px-[31.4px] bg-betaagendorcombr-dodger-blue absolute w-[calc(100%_-_207.4px)] top-[16px] right-[12.1px] left-[195.3px] rounded box-border flex flex-row items-center justify-center">
              <div className="relative text-sm leading-[20px] font-medium font-betaagendorcombr-semantic-button text-betaagendorcombr-white text-center">
                Fazer ligação
              </div>
            </button>
            <button className="cursor-pointer border-betaagendorcombr-dodger-blue border-[2px] border-solid py-2 pl-[20.6px] pr-[16.6px] bg-betaagendorcombr-dodger-blue absolute w-[calc(100%_-_207.4px)] top-[60px] right-[195.4px] left-[12px] rounded box-border flex flex-row items-center justify-center">
              <div className="relative text-sm leading-[20px] font-medium font-betaagendorcombr-semantic-button text-betaagendorcombr-white text-center">
                Enviar WhatsApp
              </div>
            </button>
          </div>
        </div>
        <div className="absolute w-[calc(100%_-_881.3px)] top-[332px] right-[16px] left-[865.3px] rounded-lg bg-betaagendorcombr-white h-[302px]">
          <div className="absolute top-[12px] left-[12px] leading-[21px] font-medium flex items-center">
            Dados básicos da empresa
          </div>
          <div className="absolute w-full top-[45px] right-[0px] left-[0px] border-betaagendorcombr-snuff border-t-[1px] border-solid box-border h-px overflow-hidden opacity-[0.25]" />
          <div className="absolute w-[calc(100%_-_16px)] top-[46px] right-[16px] left-[0px] h-64 overflow-auto text-xs">
            <div className="absolute top-[18px] left-[12px] leading-[18px] font-medium flex items-center">
              Descrição
            </div>
            <div className="absolute top-[49px] left-[12px] text-sm leading-[21px] text-betaagendorcombr-blue-bell flex items-center">
              Adicionar descrição
            </div>
            <div className="absolute top-[84px] left-[12px] leading-[18px] font-medium flex items-center">
              CNPJ
            </div>
            <div className="absolute top-[82px] left-[134.9px] text-sm leading-[21px] text-betaagendorcombr-blue-bell flex items-center">
              Adicionar
            </div>
            <div className="absolute top-[117px] left-[12px] leading-[18px] font-medium flex items-center">
              Razão social
            </div>
            <Component2
              variant={3}
              text="Adicionar"
              component2Top="115px"
              component2Right="unset"
              component2Left="134.9px"
              component2Height="calc(100% - 235px)"
              component2Bottom="120px"
              component2Position="absolute"
            />
            <a className="[text-decoration:none] absolute top-[150px] left-[12px] leading-[18px] font-medium text-[inherit] flex items-center">
              Categoria
            </a>
            <div className="absolute top-[148px] left-[134.9px] text-sm leading-[21px] text-betaagendorcombr-blue-bell flex items-center">
              Adicionar
            </div>
            <div className="absolute top-[183px] left-[12px] leading-[18px] font-medium flex items-center">
              Origem
            </div>
            <div className="absolute top-[181px] left-[134.9px] text-sm leading-[21px] text-betaagendorcombr-blue-bell flex items-center">
              Adicionar
            </div>
            <div className="absolute top-[217.5px] left-[12px] leading-[18px] font-medium flex items-center">
              Cadastrado por
            </div>
            <div className="absolute w-[64.23%] top-[calc(50%_+_86px)] right-[3.66%] left-[32.11%] flex flex-row items-center justify-start py-0 px-3 box-border gap-item-spacing-xxs max-w-[368.66px] text-3xs text-betaagendorcombr-white">
              <div className="w-6 rounded-xl bg-betaagendorcombr-east-bay border-betaagendorcombr-white border-[2px] border-solid box-border h-6 overflow-hidden shrink-0 flex flex-row items-center justify-center py-[7px] px-[5.1px]">
                <div className="relative leading-[10px] uppercase font-medium">
                  AB
                </div>
              </div>
              <Component2
                variant={2}
                text="Usuário"
                component2Top="unset"
                component2Right="unset"
                component2Left="unset"
                component2Height="unset"
                component2Bottom="unset"
                component2Position="unset"
              />
            </div>
            <div className="absolute top-[253.5px] left-[12px] leading-[18px] font-medium flex items-center">
              Responsável
            </div>
            <Component2
              variant={2}
              text="Alberto Barcelos"
              component2Top="calc(50% + 123.5px)"
              component2Right="unset"
              component2Left="162.9px"
              component2Height="unset"
              component2Bottom="unset"
              component2Position="absolute"
            />
            <div className="absolute top-[288px] left-[12px] leading-[18px] font-medium flex items-center">
              Setor
            </div>
            <div className="absolute top-[286px] left-[134.9px] text-sm leading-[21px] text-betaagendorcombr-blue-bell flex items-center">
              Adicionar
            </div>
            <div className="absolute top-[321px] left-[12px] leading-[18px] font-medium flex items-center">
              Data de cadastro
            </div>
            <div className="absolute top-[319px] left-[134.9px] text-sm leading-[21px] flex items-center">
              14/01/2025 às 18:27
            </div>
            <div className="absolute top-[354px] left-[12px] leading-[18px] font-medium flex items-center">
              Última
            </div>
            <div className="absolute top-[375px] left-[12px] leading-[18px] font-medium flex items-center">
              atualização
            </div>
            <div className="absolute top-[362.5px] left-[134.9px] text-sm leading-[21px] flex items-center">
              Ontem às 22:40
            </div>
          </div>
        </div>
        <div className="absolute w-[calc(100%_-_881.3px)] top-[646px] right-[16px] left-[865.3px] rounded-lg bg-betaagendorcombr-white h-[302px]">
          <div className="absolute top-[12px] left-[12px] leading-[21px] font-medium flex items-center">
            Informações para contato
          </div>
          <div className="absolute w-full top-[45px] right-[0px] left-[0px] border-betaagendorcombr-snuff border-t-[1px] border-solid box-border h-px overflow-hidden opacity-[0.25]" />
          <div className="absolute w-[calc(100%_-_16px)] top-[46px] right-[16px] left-[0px] h-64 overflow-auto text-xs">
            <div className="absolute top-[18px] left-[12px] leading-[18px] font-medium flex items-center">
              Email
            </div>
            <div className="absolute top-[16px] left-[134.9px] text-sm leading-[21px] text-betaagendorcombr-blue-bell flex items-center">
              Adicionar
            </div>
            <div className="absolute top-[51px] left-[12px] leading-[18px] font-medium flex items-center">
              Celular
            </div>
            <div className="absolute top-[49px] left-[134.9px] text-sm leading-[21px] text-betaagendorcombr-blue-bell flex items-center">
              Adicionar
            </div>
            <div className="absolute top-[84px] left-[12px] leading-[18px] font-medium flex items-center">
              Whatsapp
            </div>
            <div className="absolute top-[82px] left-[134.9px] text-sm leading-[21px] text-betaagendorcombr-blue-bell flex items-center">
              Adicionar
            </div>
            <div className="absolute top-[117px] left-[12px] leading-[18px] font-medium flex items-center">
              Telefone
            </div>
            <div className="absolute top-[115px] left-[134.9px] text-sm leading-[21px] text-betaagendorcombr-blue-bell flex items-center">
              Adicionar
            </div>
            <div className="absolute top-[150px] left-[12px] leading-[18px] font-medium flex items-center">
              Website
            </div>
            <Component2
              variant={3}
              text="Adicionar"
              component2Top="148px"
              component2Right="unset"
              component2Left="134.9px"
              component2Height="calc(100% - 235px)"
              component2Bottom="87px"
              component2Position="absolute"
            />
            <div className="absolute top-[183px] left-[12px] leading-[18px] font-medium flex items-center">
              Endereço
            </div>
            <div className="absolute top-[214px] left-[12px] text-sm leading-[21px] flex items-center">
              Brasil
            </div>
            <div className="absolute top-[249.4px] left-[12px] leading-[18px] font-medium flex items-center">
              Pessoas da empresa
            </div>
            <div className="absolute w-[calc(100%_-_38px)] top-[280.4px] right-[26px] left-[12px] flex flex-row items-start justify-start gap-item-spacing-xxs text-sm text-betaagendorcombr-dodger-blue">
              <div className="relative leading-[21px] font-medium">
                Alberto barcelos
              </div>
              <div className="w-4 relative h-4" />
            </div>
            <div className="absolute top-[315.4px] left-[12px] leading-[18px] font-medium flex items-center">
              Cargo
            </div>
            <Component2
              variant={3}
              text="Adicionar"
              component2Top="313.4px"
              component2Right="unset"
              component2Left="134.9px"
              component2Height="calc(100% - 235px)"
              component2Bottom="-78.4px"
              component2Position="absolute"
            />
            <div className="absolute top-[348.4px] left-[12px] leading-[18px] font-medium flex items-center">
              Email
            </div>
            <div className="absolute top-[346.4px] left-[134.9px] text-sm leading-[21px] text-betaagendorcombr-blue-bell flex items-center">
              Adicionar
            </div>
            <div className="absolute top-[381.4px] left-[12px] leading-[18px] font-medium flex items-center">
              Celular
            </div>
            <div className="absolute top-[379.4px] left-[134.9px] text-sm leading-[21px] text-betaagendorcombr-blue-bell flex items-center">
              Adicionar
            </div>
            <div className="absolute top-[414.4px] left-[12px] leading-[18px] font-medium flex items-center">
              Whatsapp
            </div>
            <div className="absolute top-[412.4px] left-[134.9px] text-sm leading-[21px] text-betaagendorcombr-blue-bell flex items-center">
              Adicionar
            </div>
            <div className="absolute top-[447.4px] left-[12px] leading-[18px] font-medium flex items-center">
              Telefone
            </div>
            <div className="absolute top-[445.4px] left-[134.9px] text-sm leading-[21px] text-betaagendorcombr-blue-bell flex items-center">
              Adicionar
            </div>
            <div className="absolute w-[calc(100%_-_38px)] top-[478.4px] right-[26px] left-[12px] border-betaagendorcombr-snuff border-t-[1px] border-solid box-border h-px overflow-hidden opacity-[0.25]" />
            <div className="absolute top-[calc(50%_+_367.4px)] left-[12px] rounded bg-betaagendorcombr-whisper border-betaagendorcombr-whisper border-[2px] border-solid flex flex-row items-center justify-center py-1.5 px-3.5 gap-item-spacing-xxs text-center text-sm text-betaagendorcombr-dodger-blue">
              <div className="w-4 relative h-4" />
              <div className="relative leading-[20px] font-medium">
                Adicionar pessoa
              </div>
            </div>
            <div className="absolute top-[537.4px] left-[12px] leading-[18px] font-medium flex items-center">
              Redes sociais
            </div>
            <div className="absolute top-[556.4px] left-[12px] text-sm leading-[21px] text-betaagendorcombr-blue-bell flex items-center">
              Nenhuma rede social
            </div>
          </div>
        </div>
        <div className="absolute w-[calc(100%_-_881.3px)] top-[960px] right-[16px] left-[865.3px] rounded-lg bg-betaagendorcombr-white h-[143px]">
          <div className="absolute top-[12px] left-[12px] leading-[21px] font-medium flex items-center">
            Produtos e serviços
          </div>
          <div className="absolute w-full top-[45px] right-[0px] left-[0px] border-betaagendorcombr-snuff border-t-[1px] border-solid box-border h-px overflow-hidden opacity-[0.25]" />
          <div className="absolute w-[calc(100%_-_16px)] top-[46px] right-[16px] left-[0px] h-[97px] overflow-auto text-center text-betaagendorcombr-dodger-blue">
            <Component2
              variant={4}
              text="Nenhum produto ou serviço cadastrado."
              component2Top="16px"
              component2Right="12px"
              component2Left="12px"
              component2Height="unset"
              component2Bottom="unset"
              component2Position="absolute"
            />
            <div className="absolute w-[calc(100%_-_24px)] top-[45px] right-[4px] left-[20px] rounded bg-betaagendorcombr-whisper border-betaagendorcombr-whisper border-[2px] border-solid box-border flex flex-row items-center justify-center py-2 px-[67.2px] gap-item-spacing-xs">
              <div className="w-4 relative h-4" />
              <div className="h-5 w-[201px] relative leading-[20px] font-medium flex items-center justify-center">
                Adicionar produtos e serviços
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Component3;
