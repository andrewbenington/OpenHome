def newPID(pid, nature, shinyXOR, abilityNum):
    nPID1 = pid
    while(True):
        nPID2 = nPID1
        i = 0
        while i < 8:
            if ((nPID2 % 25) == nature and ((nPID2 >> 16) ^ (nPID2 & 0xffff) ^ shinyXOR) < 8 and (nPID2 & 1) + 1 == abilityNum):
                return nPID2
            nPID2 = nPID1 ^ i
            i+= 1
        nPID1 = (nPID1 + 0x10000) & 0xffffffff


