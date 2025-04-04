import { Test, TestingModule } from '@nestjs/testing'

import { UporabnikiController } from './users.controller'

describe('UporabnikiController', () => {
  let controller: UporabnikiController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UporabnikiController],
    }).compile()

    controller = module.get<UporabnikiController>(UporabnikiController)
  })
  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
