import { TestBed } from '@angular/core/testing';
import { RendererService } from './renderer.service';
import { ModelerService } from '../Modeler/modeler.service';
import { ElementRegistryService } from '../ElementRegistry/element-registry.service';
import { IconSetConfigurationService } from '../IconSetConfiguration/icon-set-configuration.service';
import { DirtyFlagService } from '../DirtyFlag/dirty-flag.service';
import { IconSetConfiguration } from '../../Domain/Common/iconSetConfiguration';
import { Dictionary } from 'src/app/Domain/Common/dictionary/dictionary';

describe('RendererService', () => {
  let service: RendererService;

  let modelerServiceSpy: jasmine.SpyObj<ModelerService>;
  let elementRegistryServiceSpy: jasmine.SpyObj<ElementRegistryService>;
  let dirtyFlagServiceSpy: jasmine.SpyObj<DirtyFlagService>;

  beforeEach(() => {
    const modelerServiceMock = jasmine.createSpyObj('ModelerService', [
      'getModeler',
      'restart',
      'commandStackChanged',
      'startDebounce',
    ]);
    const elementRegistryServiceMock = jasmine.createSpyObj(
      'ElementRegistryService',
      ['correctInitialize', 'createObjectListForDSTDownload'],
    );
    const dirtyFlagServiceMock = jasmine.createSpyObj('DirtyFlagService', [
      'makeClean',
    ]);
    const domainConfigurationServiceMock = jasmine.createSpyObj(
      'DomainConfigurationService',
      ['getNewIconConfiguration'],
    );

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ModelerService,
          useValue: modelerServiceMock,
        },
        {
          provide: ElementRegistryService,
          useValue: elementRegistryServiceMock,
        },
        {
          provide: DirtyFlagService,
          useValue: dirtyFlagServiceMock,
        },
      ],
    });
    modelerServiceSpy = TestBed.inject(
      ModelerService,
    ) as jasmine.SpyObj<ModelerService>;
    elementRegistryServiceSpy = TestBed.inject(
      ElementRegistryService,
    ) as jasmine.SpyObj<ElementRegistryService>;
    dirtyFlagServiceSpy = TestBed.inject(
      DirtyFlagService,
    ) as jasmine.SpyObj<DirtyFlagService>;
    service = TestBed.inject(RendererService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('renderStory', () => {
    beforeEach(() => {
      modelerServiceSpy.getModeler.and.returnValue({
        importCustomElements: (story: any) => {},
      });
    });

    it('should call modelerService', () => {
      service.renderStory([]);
      expect(modelerServiceSpy.getModeler).toHaveBeenCalled();
    });
  });

  describe('importStory', () => {
    const domainConfig: IconSetConfiguration = {
      name: 'test',
      actors: new Dictionary(),
      workObjects: new Dictionary(),
    };

    beforeEach(() => {
      modelerServiceSpy.getModeler.and.returnValue({
        importCustomElements: (story: any) => {},
      });
      modelerServiceSpy.restart.and.returnValue();
      elementRegistryServiceSpy.correctInitialize.and.returnValue();
      modelerServiceSpy.commandStackChanged.and.returnValue();
      modelerServiceSpy.startDebounce.and.returnValue();
      dirtyFlagServiceSpy.makeClean.and.returnValue();
    });

    it('should call correct functions - configHasChanged and makeClean', () => {
      service.importStory([], true, domainConfig);

      expect(modelerServiceSpy.restart).toHaveBeenCalled();
      expect(elementRegistryServiceSpy.correctInitialize).toHaveBeenCalledTimes(
        1,
      );
      expect(modelerServiceSpy.commandStackChanged).toHaveBeenCalledTimes(1);
      expect(modelerServiceSpy.startDebounce).toHaveBeenCalledTimes(1);
      expect(dirtyFlagServiceSpy.makeClean).toHaveBeenCalled();
    });

    it('should call correct functions - configHasChanged and not makeClean', () => {
      service.importStory([], true, domainConfig, false);

      expect(modelerServiceSpy.restart).toHaveBeenCalled();
      expect(elementRegistryServiceSpy.correctInitialize).toHaveBeenCalledTimes(
        1,
      );
      expect(modelerServiceSpy.commandStackChanged).toHaveBeenCalledTimes(1);
      expect(modelerServiceSpy.startDebounce).toHaveBeenCalledTimes(1);
      expect(dirtyFlagServiceSpy.makeClean).toHaveBeenCalledTimes(0);
    });

    it('should call correct functions - not configHasChanged and makeClean', () => {
      service.importStory([], false);

      expect(modelerServiceSpy.getModeler).toHaveBeenCalled();
      expect(modelerServiceSpy.restart).toHaveBeenCalledTimes(1);
      expect(elementRegistryServiceSpy.correctInitialize).toHaveBeenCalled();
      expect(modelerServiceSpy.commandStackChanged).toHaveBeenCalled();
      expect(modelerServiceSpy.startDebounce).toHaveBeenCalled();
      expect(dirtyFlagServiceSpy.makeClean).toHaveBeenCalled();
    });
  });

  describe('getStory', () => {
    it('should call createObjectListForDSTDownload', () => {
      elementRegistryServiceSpy.createObjectListForDSTDownload.and.returnValue(
        [],
      );
      service.getStory();
      expect(
        elementRegistryServiceSpy.createObjectListForDSTDownload,
      ).toHaveBeenCalled();
    });
  });
});
