SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../../include
LDIR := ../../../lib
BIN := ~/bin
WARN := -Wall 
CXXFLAGS := ${WARN} ${ARCH} -O2 -std=c++0x

LIBS := ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

HFILES = ${IDIR}/stdinc.h ${IDIR}/Dlist.h ${IDIR}/Wflograph.h \
	 ${IDIR}/mcfCycRed.h ${IDIR}/mcfLcap.h ${IDIR}/mcfScale.h
XFILES = testMflo timeMflo badCaseAugPath

${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${XFILES}

testMflo: testMflo.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

timeMflo: timeMflo.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

badCaseAugPath: badCaseAugPath.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean:
	rm -f *.o ${XFILES}
